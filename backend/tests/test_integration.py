import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.db.session import Base
from backend.models.models import Entity, Signal
from backend.schemas.schemas import SignalCreate
from backend.services.signal_service import signal_service
from backend.services.world_model_service import world_model_service
from backend.services.reasoning_service import reasoning_service
from backend.services.forecast_service import forecast_service
from backend.services.simulation_service import simulation_service
from backend.services.wire_service import wire_service

# Use in-memory SQLite for test isolation
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_full_pipeline_integration(test_db):
    """
    Integration test for:
    Signal -> Investigation -> Research -> World Model Update -> Prediction -> Simulation -> Action
    """
    # 1. World Model Entities
    acme = await world_model_service.get_or_create_entity(test_db, "Acme AI", "company", "acme.ai")
    comp_x = await world_model_service.get_or_create_entity(test_db, "Competitor X", "competitor", "competitorx.ai")
    assert acme.id is not None
    assert comp_x.id is not None

    # 2. Signal Creation (Sentinel)
    demo_sig_data = signal_service.get_seed_demo_signal()
    sig = await signal_service.create_signal(test_db, SignalCreate(
        entity=comp_x.name,
        entity_id=comp_x.id,
        source=demo_sig_data["source"],
        url=demo_sig_data["url"],
        event_type=demo_sig_data["event_type"],
        title=demo_sig_data["title"],
        summary=demo_sig_data["summary"],
        content=demo_sig_data["content"],
        importance=demo_sig_data["importance"],
        severity=demo_sig_data["severity"],
        confidence=demo_sig_data["confidence"],
        actionability=demo_sig_data["actionability"],
        is_demo=True
    ))
    assert sig.id is not None

    # 3. Investigation & Evidence (Cortex)
    inv = await reasoning_service.investigate_signal(test_db, sig)
    assert inv.id is not None
    assert "enterprise" in inv.interpretation.lower()
    assert len(inv.implications) >= 2

    # 4. World Model Update
    rel = await world_model_service.update_relationship(
        test_db, comp_x.id, acme.id, "competes_with", confidence=95, current_val="Price & Governance War"
    )
    assert rel.relationship_type == "competes_with"
    assert rel.current_value == "Price & Governance War"

    # 5. Prediction (Oracle)
    pred = await forecast_service.generate_prediction(test_db, signal=sig, entity_id=comp_x.id)
    assert pred.id is not None
    assert pred.probability > 70
    assert len(pred.supporting_signals) >= 2

    # 6. Simulation (Simulator)
    scenarios = await simulation_service.generate_scenarios(test_db, signal=sig, prediction=pred, entity_id=comp_x.id)
    assert len(scenarios) == 3
    rec_scenario = next(s for s in scenarios if s.recommended)
    assert "DIFFERENTIATE" in rec_scenario.scenario

    # 7. Action Execution (Hands)
    action_payload = {
        "repo": "acme-ai/enterprise-platform",
        "title": "Counter Pricing War",
        "body": "Deploy Governance Suite v2 bundle for free."
    }
    action = await wire_service.execute_action(
        test_db,
        action_id="github.issue.create",
        payload=action_payload,
        entity_id=acme.id,
        signal_id=sig.id,
        scenario_id=rec_scenario.id,
        auto_approved=True,
        is_demo=True
    )
    assert action.status == "completed"
    assert action.execution_result is not None
