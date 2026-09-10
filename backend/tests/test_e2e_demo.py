import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.db.session import init_db

@pytest.mark.asyncio
async def test_deterministic_demo_pipeline_e2e():
    """
    End-to-End test of the 13-step deterministic DEMO flow:
    Demo Signal -> Full pipeline -> Action execution layer
    """
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "healthy"
        assert "Anakin Forge" in health_data["hackathon"]

        # 2. Run deterministic demo
        demo_res = await client.post("/api/demo/run")
        assert demo_res.status_code == 200
        demo_data = demo_res.json()

        assert demo_data["status"] == "success"
        assert "MISSION COMPLETE" in demo_data["message"]
        assert len(demo_data["agent_trail"]) == 5 # OBSERVE, UNDERSTAND, PREDICT, SIMULATE, ACT
        
        # Verify stages in trail
        phases = [step["phase"] for step in demo_data["agent_trail"]]
        assert phases == ["OBSERVE", "UNDERSTAND", "PREDICT", "SIMULATE", "ACT"]

        # Verify Signal
        assert demo_data["signal"]["is_demo"] is True
        assert "Competitor X" in demo_data["signal"]["entity"]

        # Verify Investigation (Cortex)
        assert len(demo_data["investigation"]["evidence"]) >= 1
        assert "governance" in demo_data["investigation"]["interpretation"].lower()

        # Verify Prediction (Oracle)
        assert demo_data["prediction"]["probability"] >= 70

        # Verify Scenarios (Simulator)
        assert len(demo_data["scenarios"]) == 3
        assert any(s["recommended"] for s in demo_data["scenarios"])

        # Verify Action (Hands)
        assert demo_data["executed_action"]["status"] == "completed"
        assert demo_data["executed_action"]["action_id"] == "github.issue.create"

        # Verify Final Takeaway
        assert "WEBODY didn't tell you what happened" in demo_data["final_takeaway"]
