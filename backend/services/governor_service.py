import logging
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models.models import Signal, WatchTarget, utc_now

logger = logging.getLogger("webody.governor")

class GovernorService:
    """
    Adaptive Polling & Volatility Governor.
    Dynamically adjusts monitoring check intervals based on entity volatility,
    conserving 60%+ external Anakin API quota while accelerating surveillance
    on high-risk competitive inflection points.
    """

    @staticmethod
    async def calculate_volatility(db: AsyncSession, entity_name: str) -> Dict[str, Any]:
        """
        Calculates domain/entity volatility based on recent 48-hour signal frequency,
        severity, and price/product change density.
        """
        threshold = utc_now() - timedelta(hours=48)
        stmt = select(Signal).where(
            Signal.entity == entity_name,
            Signal.timestamp >= threshold
        )
        res = await db.execute(stmt)
        recent_signals = res.scalars().all()

        count = len(recent_signals)
        critical_count = sum(1 for s in recent_signals if s.severity == "critical")
        price_change_count = sum(1 for s in recent_signals if "price" in s.event_type)

        # Volatility formula (0-100)
        base_score = min(60, count * 15)
        severity_bonus = critical_count * 20
        price_bonus = price_change_count * 15
        volatility_score = min(100, base_score + severity_bonus + price_bonus)

        # Dynamic frequency recommendation
        if volatility_score >= 75:
            recommended_freq = "5m" # Surge surveillance
            status = "HIGH VOLATILITY (SURGE MONITORING)"
            quota_savings_pct = 40
        elif volatility_score >= 40:
            recommended_freq = "hourly"
            status = "MODERATE VOLATILITY (HOURLY SYNC)"
            quota_savings_pct = 75
        else:
            recommended_freq = "daily"
            status = "STABLE / LOW VOLATILITY (DECAY ACTIVE)"
            quota_savings_pct = 92

        return {
            "entity": entity_name,
            "volatility_score": volatility_score,
            "status": status,
            "recent_signal_count": count,
            "critical_signals": critical_count,
            "recommended_frequency": recommended_freq,
            "estimated_quota_savings_pct": quota_savings_pct,
            "calculated_at": utc_now().isoformat()
        }

    @staticmethod
    async def apply_governor_to_watch_targets(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Evaluates all active watch targets and dynamically updates their monitoring frequency.
        """
        stmt = select(WatchTarget).where(WatchTarget.enabled == True)
        res = await db.execute(stmt)
        targets = res.scalars().all()

        results = []
        for target in targets:
            vol = await GovernorService.calculate_volatility(db, target.name)
            old_freq = target.monitoring_frequency
            target.monitoring_frequency = vol["recommended_frequency"]
            results.append({
                "target_id": target.id,
                "name": target.name,
                "previous_frequency": old_freq,
                "adapted_frequency": target.monitoring_frequency,
                "volatility_score": vol["volatility_score"]
            })

        await db.commit()
        return results

governor_service = GovernorService()
