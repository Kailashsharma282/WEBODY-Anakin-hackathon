from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.models.models import TimelineEvent, Entity, utc_now
from backend.schemas.schemas import TimelineEventResponse

class TimelineService:
    @staticmethod
    async def add_event(
        db: AsyncSession,
        entity_id: str,
        title: str,
        description: str,
        source: str,
        event_type: str,
        confidence: int = 85,
        impact: str = "medium",
        custom_time: Optional[datetime] = None
    ) -> TimelineEvent:
        event = TimelineEvent(
            entity_id=entity_id,
            timestamp=custom_time or utc_now(),
            title=title,
            description=description,
            source=source,
            event_type=event_type,
            confidence=confidence,
            impact=impact,
            created_at=utc_now()
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def get_timeline_for_entity(db: AsyncSession, entity_id: str) -> List[TimelineEvent]:
        stmt = select(TimelineEvent).where(TimelineEvent.entity_id == entity_id).order_by(TimelineEvent.timestamp.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def seed_entity_timeline(db: AsyncSession, entity: Entity):
        """
        Populates historical timeline matching the narrative in Section 12 of the PDF:
        Jun 03 Hiring spike detected
        Jun 17 New API documentation
        Jul 02 Enterprise landing page changed
        Jul 14 Pricing changed
        Jul 19 Prediction generated
        Jul 25 Launch detected
        """
        now = utc_now()
        historical_events = [
            ("Jun 03 Hiring spike detected", "Sudden surge in security engineering and policy compliance job postings.", "Anakin Web Monitor", "hiring_changes", 85, "medium", now - timedelta(days=53)),
            ("Jun 17 New API documentation", "Pre-release endpoints /v2/compliance and /v2/guardrails discovered in sitemap.", "Anakin Map", "documentation_changes", 90, "medium", now - timedelta(days=39)),
            ("Jul 02 Enterprise landing page changed", "Hero headline updated to emphasize 'Enterprise AI Governance & Auditability'.", "Anakin URL Scraper", "positioning_changes", 92, "high", now - timedelta(days=24)),
            ("Jul 14 Pricing changed", "Base enterprise pricing reduced by 22% with included compliance suite.", "Anakin Monitor", "price_changes", 98, "critical", now - timedelta(days=12)),
            ("Jul 19 Prediction generated", "Oracle forecasted broader enterprise strategy expansion within 30 days.", "WEBODY Oracle", "prediction_generated", 88, "high", now - timedelta(days=7)),
            ("Jul 25 Launch detected", "Formal rollout of automated SOC2 audit generator.", "Anakin Search", "product_changes", 95, "critical", now - timedelta(days=1))
        ]

        for title, desc, source, ev_type, conf, impact, timestamp in historical_events:
            await TimelineService.add_event(
                db, entity_id=entity.id, title=title, description=desc,
                source=source, event_type=ev_type, confidence=conf, impact=impact, custom_time=timestamp
            )

timeline_service = TimelineService()
