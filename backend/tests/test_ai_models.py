import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.db.session import Base
from backend.models.models import Signal
from backend.schemas.schemas import SignalCreate
from backend.services.signal_service import signal_service
from backend.services.reasoning_service import reasoning_service
from backend.services.forecast_service import forecast_service
from backend.services.simulation_service import simulation_service
from backend.services.adversarial_oracle_service import adversarial_oracle_service
from backend.services.cross_llm_radar_service import cross_llm_radar_service
from backend.services.rlhf_service import rlhf_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def test_ai_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_adaptive_cortex_reasoning_for_custom_entity(test_ai_db):
    sig = await signal_service.create_signal(test_ai_db, SignalCreate(
        entity="Anthropic",
        source="anthropic.com/news",
        url="https://anthropic.com/news/computer-use",
        event_type="feature_launch",
        title="Anthropic introduces Computer Use API for desktop agents",
        summary="Autonomous agent capability directly driving browser and GUI workflows.",
        importance=95,
        severity="high",
        is_demo=False
    ))

    inv = await reasoning_service.investigate_signal(test_ai_db, sig)
    assert inv.id is not None
    assert "Anthropic" in inv.title
    assert "Anthropic" in inv.interpretation or "Computer Use" in inv.interpretation
    assert len(inv.implications) >= 2
    assert len(inv.unknowns) >= 2

@pytest.mark.asyncio
async def test_adaptive_oracle_bayesian_forecast(test_ai_db):
    sig = await signal_service.create_signal(test_ai_db, SignalCreate(
        entity="Stripe",
        source="stripe.com/billing",
        url="https://stripe.com/billing",
        event_type="billing_packaging",
        title="Stripe bundles automated tax and invoicing",
        summary="Packaging shift bundling previously paid features.",
        importance=88,
        severity="medium",
        is_demo=False
    ))

    pred = await forecast_service.generate_prediction(test_ai_db, signal=sig)
    assert pred.id is not None
    assert 60 <= pred.probability <= 98
    assert 70 <= pred.confidence <= 100
    assert "Stripe" in pred.prediction
    assert len(pred.supporting_signals) >= 2

@pytest.mark.asyncio
async def test_adaptive_simulation_scenarios_and_rlhf(test_ai_db):
    sig = await signal_service.create_signal(test_ai_db, SignalCreate(
        entity="OpenAI",
        source="openai.com/pricing",
        url="https://openai.com/pricing",
        event_type="price_cut",
        title="OpenAI slashes GPT-4o mini inference pricing by 60%",
        summary="High-throughput price reduction.",
        importance=92,
        severity="critical",
        is_demo=False
    ))

    scenarios = await simulation_service.generate_scenarios(test_ai_db, signal=sig)
    assert len(scenarios) == 3
    rec = next((s for s in scenarios if s.recommended), None)
    assert rec is not None
    assert rec.score >= 80

@pytest.mark.asyncio
async def test_custom_adversarial_debate():
    res = await adversarial_oracle_service.conduct_adversarial_debate(
        event_title="DeepMind releases Gemini 2.0 native tool agent",
        entity_name="Google DeepMind",
        event_summary="Native agentic execution threatens wrapper startups."
    )
    assert "Google DeepMind" in res["entity"]
    assert len(res["bull_agent"]["arguments"]) >= 2
    assert len(res["bear_agent"]["arguments"]) >= 2
    assert 50 <= res["calibrated_probability"] <= 98
    assert res["uncertainty_bound"] == 100 - res["calibrated_confidence"]

@pytest.mark.asyncio
async def test_custom_cross_llm_radar():
    radar = await cross_llm_radar_service.run_radar_analysis(brand_name="Stripe", competitor_name="Adyen")
    assert radar["brand"] == "Stripe"
    assert radar["competitor"] == "Adyen"
    assert len(radar["model_breakdown"]) == 5
    assert radar["aggregate_brand_share_of_voice"] + radar["aggregate_competitor_share_of_voice"] == 100
