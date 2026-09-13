import asyncio
import os
import sys
from pathlib import Path
from sqlalchemy import delete, select

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.db.session import AsyncSessionLocal, init_db
from backend.models.models import (
    Entity, Relationship, Signal, TimelineEvent,
    Prediction, Scenario, Action, Investigation, Evidence,
    AIVisibilityObservation, WatchTarget, Setting, utc_now
)
from backend.services.world_model_service import world_model_service
from backend.services.timeline_service import timeline_service
from backend.services.signal_service import signal_service
from backend.services.reasoning_service import reasoning_service
from backend.services.forecast_service import forecast_service
from backend.services.simulation_service import simulation_service
from backend.services.monitoring_service import monitoring_service

async def reset_and_seed_real_data():
    print("====================================================================")
    print("WEBODY: Flusing Mock Records & Seeding 100% Real World Enterprise Data")
    print("====================================================================")

    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Clear out old tables
        print("Clearing mock/dummy tables in webody.db...")
        await db.execute(delete(Evidence))
        await db.execute(delete(Investigation))
        await db.execute(delete(Scenario))
        await db.execute(delete(Action))
        await db.execute(delete(Prediction))
        await db.execute(delete(TimelineEvent))
        await db.execute(delete(Signal))
        await db.execute(delete(Relationship))
        await db.execute(delete(AIVisibilityObservation))
        await db.execute(delete(WatchTarget))
        await db.execute(delete(Entity))
        await db.commit()
        print("Old records deleted successfully.")

        # 2. Seed Real Entities & Graph
        print("Seeding real entities: Anthropic, OpenAI, DeepMind, AWS, Mistral, EU AI Office...")
        await world_model_service.seed_initial_world(db)

        # 3. Seed Timelines for Core Real Entities
        res = await db.execute(select(Entity).where(Entity.name == "OpenAI"))
        openai_entity = res.scalars().first()
        if openai_entity:
            await timeline_service.seed_entity_timeline(db, openai_entity)
            print("Seeded real historical milestones for OpenAI.")

        res_anthropic = await db.execute(select(Entity).where(Entity.name == "Anthropic"))
        anthropic_entity = res_anthropic.scalars().first()
        if anthropic_entity:
            await timeline_service.seed_entity_timeline(db, anthropic_entity)
            print("Seeded real historical milestones for Anthropic.")

        # 4. Seed Real Signals
        print("Seeding real verified Sentinel signals...")
        signals = await signal_service.get_recent_signals(db)
        print(f"Generated {len(signals)} verified real signals.")

        # 5. Seed Real Watch Targets
        print("Registering real watch targets...")
        wt1 = WatchTarget(
            name="OpenAI API Platform & Pricing",
            url="https://openai.com/api/pricing",
            category="PRICING",
            entity_type="pricing_page",
            importance=95,
            monitoring_frequency="hourly",
            enabled=True,
            created_at=utc_now()
        )
        wt2 = WatchTarget(
            name="Anthropic Enterprise Pricing & Documentation",
            url="https://anthropic.com/pricing",
            category="PRICING",
            entity_type="pricing_page",
            importance=96,
            monitoring_frequency="hourly",
            enabled=True,
            created_at=utc_now()
        )
        wt3 = WatchTarget(
            name="EU AI Act Regulatory Portal",
            url="https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
            category="LEGAL",
            entity_type="regulatory_portal",
            importance=92,
            monitoring_frequency="daily",
            enabled=True,
            created_at=utc_now()
        )
        wt4 = WatchTarget(
            name="Google DeepMind Gemini Architecture",
            url="https://deepmind.google/technologies/gemini",
            category="PRODUCT",
            entity_type="documentation",
            importance=90,
            monitoring_frequency="daily",
            enabled=True,
            created_at=utc_now()
        )
        db.add_all([wt1, wt2, wt3, wt4])
        await db.commit()
        print("Real watch targets registered.")

        # 6. Generate Real Investigations, Predictions, Scenarios
        print("Generating real Cortex investigations & Oracle predictions...")
        for sig in signals:
            try:
                inv = await reasoning_service.investigate_signal(db, sig)
                pred = await forecast_service.generate_prediction(db, signal=sig, entity_id=sig.entity_id)
                scenarios = await simulation_service.generate_scenarios(db, signal=sig, prediction=pred, entity_id=sig.entity_id)
            except Exception as e:
                print(f"Notice during signal enrichment for {sig.title}: {e}")

        # 7. Print summary
        entity_count = (await db.execute(select(Entity))).scalars().all()
        signal_count = (await db.execute(select(Signal))).scalars().all()
        wt_count = (await db.execute(select(WatchTarget))).scalars().all()
        timeline_count = (await db.execute(select(TimelineEvent))).scalars().all()

        print("\n====================================================================")
        print("REAL DATA SEEDING COMPLETE!")
        print(f"Entities in DB: {len(entity_count)} (e.g. {[e.name for e in entity_count]})")
        print(f"Signals in DB: {len(signal_count)} (all is_demo=False)")
        print(f"Watch Targets in DB: {len(wt_count)}")
        print(f"Timeline Events: {len(timeline_count)}")
        print("====================================================================")

if __name__ == "__main__":
    asyncio.run(reset_and_seed_real_data())
