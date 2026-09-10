import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.db.session import Base
from backend.models.models import Signal
from backend.schemas.schemas import SignalCreate
from backend.services.signal_service import signal_service
from backend.services.governor_service import governor_service
from backend.services.vector_memory_service import vector_memory_service
from backend.services.adversarial_oracle_service import adversarial_oracle_service
from backend.services.cross_llm_radar_service import cross_llm_radar_service
from backend.services.rlhf_service import rlhf_service
from backend.services.wire_service import WireService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def memory_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_governor_volatility_calculation(memory_db):
    # Seed a high severity signal
    await signal_service.create_signal(memory_db, SignalCreate(
        entity="Competitor X",
        source="competitorx.ai/pricing",
        url="https://competitorx.ai/pricing",
        event_type="price_changes",
        title="Slashing prices by 22%",
        summary="Enterprise pricing lowered.",
        importance=95,
        severity="critical"
    ))

    vol = await governor_service.calculate_volatility(memory_db, "Competitor X")
    assert vol["volatility_score"] > 0
    assert vol["estimated_quota_savings_pct"] > 0
    assert "VOLATILITY" in vol["status"]

def test_vector_memory_search():
    # Search for compliance or pricing
    results = vector_memory_service.search("compliance guardrails", top_k=2)
    assert len(results) >= 1
    assert results[0]["similarity"] > 0.15
    assert "compliance" in results[0]["text"].lower() or "guardrails" in results[0]["text"].lower()

@pytest.mark.asyncio
async def test_adversarial_oracle_debate():
    debate = await adversarial_oracle_service.conduct_adversarial_debate(
        event_title="Competitor X reduces pricing by 22%",
        entity_name="Competitor X",
        event_summary="Discounts applied with automated compliance hooks."
    )
    assert debate["bull_agent"]["projected_probability"] > 70
    assert debate["bear_agent"]["projected_probability"] > 50
    assert 50 <= debate["calibrated_probability"] <= 100
    assert debate["uncertainty_bound"] == (100 - debate["calibrated_confidence"])
    assert len(debate["historical_precedents"]) >= 1

@pytest.mark.asyncio
async def test_cross_llm_radar():
    radar = await cross_llm_radar_service.run_radar_analysis("Acme AI", "Competitor X")
    assert radar["total_surfaces_analyzed"] == 5
    assert radar["aggregate_brand_share_of_voice"] >= 50
    assert radar["winning_surface_count"] >= 3

def test_rlhf_preference_learning():
    initial_diff = rlhf_service.weights["differentiation_preference"]
    res = rlhf_service.record_decision(
        chosen_scenario="Scenario C: DIFFERENTIATE",
        score=94,
        risk=25,
        benefit=90,
        complexity=35,
        rejected_scenarios=["Scenario A: DO NOTHING", "Scenario B: MATCH PRICE"]
    )
    assert res["total_decisions_recorded"] >= 1
    assert rlhf_service.weights["differentiation_preference"] >= initial_diff

def test_wire_canary_guardrails():
    schema = {"action_id": "system.exec", "required_inputs": ["command"]}
    
    # Safe command
    assert WireService.validate_action_inputs(schema, {"command": "git checkout -b counter-measure"}) is True

    # Destructive command blocked by canary guardrail
    with pytest.raises(ValueError) as excinfo:
        WireService.validate_action_inputs(schema, {"command": "DROP DATABASE enterprise_prod;"})
    assert "Canary Guardrail Triggered" in str(excinfo.value)
