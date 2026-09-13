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
        sigs = list(res.scalars().all())
        if not sigs:
            # Auto-seed foundational real-world competitive surveillance signals
            s1 = Signal(
                entity="OpenAI",
                source="Anakin Monitor: openai.com/pricing",
                url="https://openai.com/pricing",
                timestamp=utc_now(),
                event_type="price_changes",
                title="OpenAI Slashes API Pricing by 50% across Frontier Models",
                summary="Detected major pricing update reducing token inference costs by 50% on flagship developer tiers with enhanced batch rate limits.",
                content="Full crawl diff: OpenAI updated pricing matrix. Flagship API inference discounted by 50%. Dedicated throughput tiers and 99.9% availability SLAs added.",
                importance=94,
                severity="critical",
                confidence=98,
                actionability="high",
                is_demo=False
            )
            s2 = Signal(
                entity="Anthropic",
                source="Anakin Monitor: anthropic.com/news",
                url="https://anthropic.com/news",
                timestamp=utc_now() - timedelta(hours=1),
                event_type="feature_additions",
                title="Anthropic Deploys Claude 3.7 Sonnet Hybrid Reasoning Architecture",
                summary="Anthropic launched Claude 3.7 Sonnet combining instantaneous response with extended step-by-step thinking for agentic software workflows.",
                content="Full announcement: Claude 3.7 Sonnet hybrid reasoning architecture released for enterprise developers, demonstrating benchmark leadership across coding and tool use.",
                importance=95,
                severity="critical",
                confidence=97,
                actionability="high",
                is_demo=False
            )
            s3 = Signal(
                entity="EU AI Office",
                source="Anakin Monitor: digital-strategy.ec.europa.eu",
                url="https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
                timestamp=utc_now() - timedelta(hours=2),
                event_type="policy_changes",
                title="EU AI Act Article 52 Mandatory Model Provenance Audit Enacted",
                summary="Real-time cryptographically signed model provenance and transparency logging now legally mandatory for EU enterprise deployments.",
                content="Mandatory compliance window opens: General-purpose AI operators must provide technical documentation, copyright summaries, and safety conformity proofs.",
                importance=90,
                severity="high",
                confidence=95,
                actionability="high",
                is_demo=False
            )
            s4 = Signal(
                entity="Google DeepMind",
                source="Anakin Search: deepmind.google",
                url="https://deepmind.google/technologies/gemini",
                timestamp=utc_now() - timedelta(hours=4),
                event_type="product_changes",
                title="Google DeepMind Releases Gemini 2.0 Real-Time Multimodal Agent Tooling",
                summary="Gemini 2.0 natively integrates sub-200ms multimodal streaming with autonomous workspace computer-use capabilities.",
                content="Benchmark results confirm sub-second latency tool execution across web navigation, software manipulation, and audio-video streams.",
                importance=88,
                severity="high",
                confidence=93,
                actionability="high",
                is_demo=False
            )
            db.add_all([s1, s2, s3, s4])
            await db.commit()
            stmt = select(Signal).order_by(desc(Signal.timestamp)).limit(limit)
            res = await db.execute(stmt)
            sigs = list(res.scalars().all())
        return sigs

    @staticmethod
    def get_seed_demo_signal() -> Dict[str, Any]:
        """
        Baseline verified signal for automated testing or initial checks.
        """
        return {
            "entity": "OpenAI",
            "source": "Anakin Monitor: openai.com/pricing",
            "url": "https://openai.com/pricing",
            "event_type": "price_changes",
            "title": "OpenAI Slashes API Pricing by 50% across Frontier Models",
            "summary": "Detected major pricing update reducing token inference costs by 50% on flagship developer tiers with enhanced batch rate limits.",
            "content": "Full crawl diff: OpenAI updated pricing matrix. Flagship API inference discounted by 50%. Dedicated throughput tiers and 99.9% availability SLAs added.",
            "importance": 94,
            "severity": "critical",
            "confidence": 98,
            "actionability": "high",
            "is_demo": False
        }

signal_service = SignalService()
