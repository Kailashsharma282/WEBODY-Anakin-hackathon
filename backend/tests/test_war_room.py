import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.war_room_service import war_room_service
from backend.services.wire_service import wire_service

@pytest.mark.asyncio
async def test_war_room_service_simulation():
    res = war_room_service.simulate_multiturn_reaction(
        primary_scenario="Differentiate with Governance Bundle",
        competitor_name="Competitor X",
        brand_name="Acme AI",
        risk_aversion=0.5,
        margin_priority=0.5,
        differentiation_priority=0.85
    )
    assert res["status"] if "status" in res else True
    assert res["market_defensibility_score"] >= 80
    assert len(res["turns"]) == 3
    assert res["turns"][0]["actor"] == "BLUE_TEAM"
    assert res["turns"][1]["actor"] == "RED_TEAM"
    assert res["turns"][2]["actor"] == "BLUE_TEAM"
    assert len(res["provenance_hash"]) == 64

@pytest.mark.asyncio
async def test_wire_catalog_expansion():
    actions = await wire_service.discover_actions()
    action_ids = [a["action_id"] for a in actions]
    assert "github.issue.create" in action_ids
    assert "slack.message.send" in action_ids
    assert "hubspot.deal.protect" in action_ids
    assert "linear.issue.create" in action_ids

@pytest.mark.asyncio
async def test_war_room_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "primary_scenario": "Differentiate with Governance Bundle",
            "competitor_name": "Competitor X",
            "brand_name": "Acme AI",
            "risk_aversion": 0.4,
            "margin_priority": 0.6,
            "differentiation_priority": 0.9
        }
        res = await ac.post("/api/war-room/simulate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["market_defensibility_score"] > 50
        assert len(data["turns"]) == 3
        assert "provenance_hash" in data

@pytest.mark.asyncio
async def test_cryptographic_audit_provenance_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/audit/provenance")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "VERIFIED"
        assert data["tampering_detected"] is False
        assert len(data["chain"]) == 7
        assert data["chain"][0]["phase"] == "GENESIS"
        assert data["chain"][1]["phase"] == "OBSERVE"
        assert data["chain"][6]["phase"] == "LEARN"

@pytest.mark.asyncio
async def test_multi_rivalry_demo_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test Frontier AI rivalry
        res = await ac.post("/api/demo/run?rivalry_id=frontier_ai")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert len(data["agent_trail"]) == 5
        assert "OpenAI" in data["signal"]["entity"] or "OpenAI" in data["signal"]["title"]
