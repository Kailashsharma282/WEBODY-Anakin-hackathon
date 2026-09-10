import re
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.models.models import Signal, Entity, WatchTarget, utc_now
from backend.schemas.schemas import SignalCreate

# Noise filter blacklist patterns
NOISE_PATTERNS = [
    r"cookie\s+policy\s+banner",
    r"copyright\s+\d{4}",
    r"session\s+token\s+refreshed",
    r"tracking\s+pixel",
    r"minor\s+typo",
    r"analytics\s+ping",
    r"pageview\s+counter"
]

def calculate_importance(event_type: str, content: str) -> int:
    """
    Computes an importance score (0-100) based on signal type and strategic gravity.
    """
    event_weights = {
        "price_changes": 92,
        "feature_additions": 88,
        "positioning_changes": 85,
        "policy_changes": 75,
        "status_incidents": 78,
        "hiring_changes": 72,
        "ai_visibility_changes": 80,
        "documentation_changes": 65,
        "content_changes": 50
    }
    base = event_weights.get(event_type, 50)
    # Adjust score if enterprise, discount, or governance mentioned
    content_lower = content.lower()
    if "enterprise" in content_lower:
        base += 5
    if "discount" in content_lower or "reduced" in content_lower or "-22%" in content_lower:
        base += 5
    if "governance" in content_lower or "compliance" in content_lower:
        base += 4
    return min(100, max(10, base))

def is_noise(title: str, content: str) -> bool:
    """
    Suppresses low-value noise matching known ephemeral patterns.
    """
    text = f"{title} {content}".lower()
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

class SignalService:
    @staticmethod
    async def create_signal(db: AsyncSession, signal_data: SignalCreate) -> Signal:
        """
        Creates and normalizes an observation into a Sentinel Signal.
        Validates duplicate suppression and noise filtering.
        """
        if is_noise(signal_data.title, signal_data.content or ""):
            raise ValueError("Signal suppressed: identified as low-value noise.")

        # Check duplicate in the last 6 hours
        recent_threshold = utc_now() - timedelta(hours=6)
        stmt = select(Signal).where(
            Signal.url == signal_data.url,
            Signal.event_type == signal_data.event_type,
            Signal.timestamp >= recent_threshold
        )
        res = await db.execute(stmt)
        existing = res.scalars().first()
        if existing:
            # Duplicate detected - return existing to avoid alert storms
            return existing

        importance = signal_data.importance or calculate_importance(signal_data.event_type, signal_data.content or signal_data.summary)

        # Severity determination
        severity = "critical" if importance >= 90 else "high" if importance >= 75 else "medium" if importance >= 50 else "low"

        signal = Signal(
            entity=signal_data.entity,
            entity_id=signal_data.entity_id,
            source=signal_data.source,
            url=signal_data.url,
            timestamp=utc_now(),
            event_type=signal_data.event_type,
            title=signal_data.title,
            summary=signal_data.summary,
            content=signal_data.content,
            importance=importance,
            severity=severity,
            confidence=signal_data.confidence,
            actionability=signal_data.actionability,
            is_demo=signal_data.is_demo
        )
        db.add(signal)
        await db.commit()
        await db.refresh(signal)
        return signal

    @staticmethod
    async def get_recent_signals(db: AsyncSession, limit: int = 50) -> List[Signal]:
        stmt = select(Signal).order_by(desc(Signal.timestamp)).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    def get_seed_demo_signal() -> Dict[str, Any]:
        """
        The deterministic DEMO SIGNAL per Section 14 & 22 of the hackathon specification:
        'Competitor X suddenly changes enterprise pricing and adds a governance-related feature.'
        """
        return {
            "entity": "Competitor X",
            "source": "Anakin Monitor: competitorx.ai/enterprise-pricing",
            "url": "https://competitorx.ai/enterprise-pricing",
            "event_type": "price_changes",
            "title": "Competitor X reduced enterprise pricing by 22% & released AI Governance Bundle",
            "summary": "Detected price reduction on Enterprise Tier from $10,000/mo to $7,800/mo (-22%) with included AI Model Governance audit suite.",
            "content": "Full crawl diff: Competitor X updated enterprise tier page. Price slashed by 22%. Features added: Automated compliance audit trails, SOC2 report generator, and model policy enforcement at zero additional charge.",
            "importance": 96,
            "severity": "critical",
            "confidence": 98,
            "actionability": "high",
            "is_demo": True
        }

signal_service = SignalService()
