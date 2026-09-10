import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models.models import WatchTarget, utc_now
from backend.services.anakin_client import anakin_client

logger = logging.getLogger("webody.monitoring")

class MonitoringService:
    """
    Website Monitoring Service per Section 4 & Section 23 of Hackathon Specification.
    Manages active watch targets and synchronizes with Anakin Website Monitoring API.
    """

    @staticmethod
    async def sync_with_anakin_monitoring(db: AsyncSession, watch_target_id: str) -> Dict[str, Any]:
        """
        Synchronizes a local watch target with Anakin's Website Monitoring capability.
        """
        stmt = select(WatchTarget).where(WatchTarget.id == watch_target_id)
        res = await db.execute(stmt)
        wt = res.scalars().first()
        if not wt:
            raise ValueError(f"Watch target {watch_target_id} not found.")

        anakin_synced = False
        monitor_id = None
        
        if anakin_client.has_api_key():
            try:
                # Map frequency string to Anakin monitoring format
                freq = "hourly" if wt.monitoring_frequency in ("realtime", "hourly") else "daily"
                res_monitor = await anakin_client.create_monitor(
                    url=wt.url,
                    frequency=freq,
                    name=f"WEBODY-WatchTarget: {wt.name}"
                )
                anakin_synced = True
                monitor_id = res_monitor.get("id") or res_monitor.get("monitor_id")
                logger.info(f"Registered Anakin Website Monitor for target {wt.name} ({wt.url})")
            except Exception as e:
                logger.warning(f"Could not register Anakin Website Monitor for {wt.url}: {e}")

        # Update last checked timestamp
        wt.last_checked = utc_now()
        await db.commit()
        await db.refresh(wt)

        return {
            "watch_target_id": wt.id,
            "url": wt.url,
            "category": wt.category,
            "anakin_synced": anakin_synced,
            "monitor_id": monitor_id,
            "last_checked": wt.last_checked.isoformat() if wt.last_checked else None
        }

    @staticmethod
    async def get_active_monitors(db: AsyncSession) -> List[WatchTarget]:
        """
        Retrieves all enabled watch targets configured for monitoring.
        """
        stmt = select(WatchTarget).where(WatchTarget.enabled == True)
        res = await db.execute(stmt)
        return list(res.scalars().all())

monitoring_service = MonitoringService()
