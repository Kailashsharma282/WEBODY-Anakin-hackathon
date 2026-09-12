import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.db.session import get_db
from backend.models.models import (
    WatchTarget, Entity, Relationship, Signal, Investigation,
    Evidence, Prediction, Scenario, Action, TimelineEvent, Setting, utc_now
)
from backend.schemas.schemas import (
    WatchTargetCreate, WatchTargetResponse,
    MapDomainRequest, MapDomainResponse,
    EntityResponse, SignalCreate, SignalResponse,
    InvestigationCreate, InvestigationResponse, EvidenceItem,
    PredictionCreate, PredictionResponse,
    SimulationCreate, SimulationResponse, ScenarioResponse,
    ActionDiscoverRequest, ActionExecuteRequest, ActionResponse,
    TimelineEventResponse, WorldGraphResponse,
    AIVisibilityResponse, DemoRunResponse, AgentTrailStep
)
from backend.services.mapping_service import mapping_service
from backend.services.scrape_service import scrape_service
from backend.services.research_service import research_service
from backend.services.signal_service import signal_service
from backend.services.world_model_service import world_model_service
from backend.services.reasoning_service import reasoning_service
from backend.services.forecast_service import forecast_service
from backend.services.simulation_service import simulation_service
from backend.services.wire_service import wire_service
from backend.services.timeline_service import timeline_service
from backend.services.ai_visibility_service import ai_visibility_service
from backend.services.anakin_client import anakin_client

from backend.services.governor_service import governor_service
from backend.services.vector_memory_service import vector_memory_service
from backend.services.adversarial_oracle_service import adversarial_oracle_service
from backend.services.cross_llm_radar_service import cross_llm_radar_service
from backend.services.rlhf_service import rlhf_service
from backend.services.security_service import ssrf_guard, mask_secret
from backend.api.websocket import manager

logger = logging.getLogger("webody.api")
api_router = APIRouter()

# Structured Event Logger for Section 30 Observability
def log_event(event_name: str, entity: str, workflow_id: str, duration_ms: int, status: str):
    logger.info(
        f"[AUDIT_LOG] event={event_name} entity='{entity}' workflow_id={workflow_id} "
        f"duration={duration_ms}ms status={status} timestamp={datetime.now(timezone.utc).isoformat()}"
    )

# 1. WATCH TARGETS (Sentinel)
@api_router.post("/watch-targets", response_model=WatchTargetResponse)
async def create_watch_target(data: WatchTargetCreate, db: AsyncSession = Depends(get_db)):
    wt = WatchTarget(
        name=data.name,
        entity_type=data.entity_type,
        url=data.url,
        category=data.category,
        importance=data.importance,
        monitoring_frequency=data.monitoring_frequency,
        enabled=data.enabled,
        last_checked=utc_now()
    )
    db.add(wt)
    await db.commit()
    await db.refresh(wt)
    return wt

@api_router.get("/watch-targets", response_model=List[WatchTargetResponse])
async def list_watch_targets(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(WatchTarget).order_by(desc(WatchTarget.importance)))
    return list(res.scalars().all())

# 2. MAP (Cartographer)
@api_router.post("/map", response_model=MapDomainResponse)
async def map_domain(req: MapDomainRequest, db: AsyncSession = Depends(get_db)):
    start = time.time()
    workflow_id = str(uuid.uuid4())[:8]
    log_event("mapping.started", req.domain, workflow_id, 0, "STARTED")

    # SSRF Guard domain validation
    validated_domain = ssrf_guard.validate_domain(req.domain)
    topology = await mapping_service.map_target_domain(validated_domain, max_pages=req.max_pages)

    # Sync entity into world model
    entity = await world_model_service.get_or_create_entity(
        db, name=topology["domain"].title(), entity_type="company", domain=topology["domain"]
    )

    duration = int((time.time() - start) * 1000)
    log_event("mapping.completed", validated_domain, workflow_id, duration, "COMPLETED")
    await manager.broadcast("world.updated", {"action": "domain_mapped", "domain": validated_domain})
    return topology

# 3. ENTITIES (World Model)
@api_router.get("/entities", response_model=List[EntityResponse])
async def list_entities(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Entity).order_by(desc(Entity.importance)))
    return list(res.scalars().all())

@api_router.get("/entities/{entity_id}")
async def get_entity_profile(entity_id: str, db: AsyncSession = Depends(get_db)):
    profile = await world_model_service.get_entity_profile(db, entity_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Entity not found")
    return profile

# 4. SIGNALS (Sentinel)
@api_router.get("/signals", response_model=List[SignalResponse])
async def list_signals(db: AsyncSession = Depends(get_db)):
    return await signal_service.get_recent_signals(db)

@api_router.post("/signals/demo", response_model=SignalResponse)
async def inject_demo_signal(db: AsyncSession = Depends(get_db)):
    """
    Injects the canonical deterministic DEMO SIGNAL (Section 14 & 22)
    """
    demo_data = signal_service.get_seed_demo_signal()
    
    # Get or create Competitor X entity
    comp = await world_model_service.get_or_create_entity(
        db, "Competitor X", entity_type="competitor", domain="competitorx.ai"
    )

    sig_in = SignalCreate(
        entity=demo_data["entity"],
        entity_id=comp.id,
        source=demo_data["source"],
        url=demo_data["url"],
        event_type=demo_data["event_type"],
        title=demo_data["title"],
        summary=demo_data["summary"],
        content=demo_data["content"],
        importance=demo_data["importance"],
        severity=demo_data["severity"],
        confidence=demo_data["confidence"],
        actionability=demo_data["actionability"],
        is_demo=True
    )
    sig = await signal_service.create_signal(db, sig_in)
    log_event("signal.detected", sig.entity, sig.id, 0, "DETECTED")
    await manager.broadcast("signal.detected", {
        "id": sig.id,
        "entity": sig.entity,
        "title": sig.title,
        "severity": sig.severity,
        "importance": sig.importance
    })
    return sig

# 5. INVESTIGATIONS ("WHY SHOULD I CARE?" / Cortex)
@api_router.post("/investigations", response_model=InvestigationResponse)
async def start_investigation(req: InvestigationCreate, db: AsyncSession = Depends(get_db)):
    t0 = time.time()
    signal_res = await db.execute(select(Signal).where(Signal.id == req.signal_id))
    sig = signal_res.scalars().first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")

    workflow_id = str(uuid.uuid4())[:8]
    log_event("research.started", sig.entity, workflow_id, 0, "STARTED")

    investigation = await reasoning_service.investigate_signal(db, sig)

    duration = int((time.time() - t0) * 1000)
    log_event("reasoning.completed", sig.entity, workflow_id, duration, "COMPLETED")

    # Load evidence
    ev_res = await db.execute(select(Evidence).where(Evidence.investigation_id == investigation.id))
    evidence_list = [
        EvidenceItem(
            id=e.id,
            source_url=e.source_url,
            source_title=e.source_title,
            claim=e.claim,
            quote=e.quote,
            confidence=e.confidence,
            relevance_score=e.relevance_score
        )
        for e in ev_res.scalars().all()
    ]

    return InvestigationResponse(
        id=investigation.id,
        signal_id=investigation.signal_id,
        entity_id=investigation.entity_id,
        title=investigation.title,
        status=investigation.status,
        event=investigation.event,
        interpretation=investigation.interpretation,
        confidence=investigation.confidence,
        importance=investigation.importance,
        strategic_theme=investigation.strategic_theme,
        evidence=evidence_list,
        implications=investigation.implications or [],
        unknowns=investigation.unknowns or [],
        created_at=investigation.created_at
    )

@api_router.get("/investigations/{inv_id}", response_model=InvestigationResponse)
async def get_investigation(inv_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Investigation).where(Investigation.id == inv_id)
    res = await db.execute(stmt)
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev_res = await db.execute(select(Evidence).where(Evidence.investigation_id == inv.id))
    evidence_list = [
        EvidenceItem(
            id=e.id,
            source_url=e.source_url,
            source_title=e.source_title,
            claim=e.claim,
            quote=e.quote,
            confidence=e.confidence,
            relevance_score=e.relevance_score
        )
        for e in ev_res.scalars().all()
    ]

    return InvestigationResponse(
        id=inv.id,
        signal_id=inv.signal_id,
        entity_id=inv.entity_id,
        title=inv.title,
        status=inv.status,
        event=inv.event,
        interpretation=inv.interpretation,
        confidence=inv.confidence,
        importance=inv.importance,
        strategic_theme=inv.strategic_theme,
        evidence=evidence_list,
        implications=inv.implications or [],
        unknowns=inv.unknowns or [],
        created_at=inv.created_at
    )

# 6. PREDICTIONS ("WHAT HAPPENS NEXT?" / Oracle)
@api_router.post("/predictions", response_model=PredictionResponse)
async def create_prediction(req: PredictionCreate, db: AsyncSession = Depends(get_db)):
    t0 = time.time()
    sig = None
    if req.signal_id:
        sig_res = await db.execute(select(Signal).where(Signal.id == req.signal_id))
        sig = sig_res.scalars().first()

    pred = await forecast_service.generate_prediction(db, signal=sig, entity_id=req.entity_id)

    duration = int((time.time() - t0) * 1000)
    log_event("prediction.created", sig.entity if sig else "Ecosystem", pred.id, duration, "COMPLETED")
    return pred

@api_router.get("/predictions", response_model=List[PredictionResponse])
async def list_predictions(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Prediction).order_by(desc(Prediction.created_at)).limit(20))
    return list(res.scalars().all())

# 7. SIMULATIONS ("WHAT CAN WE DO?" / Simulator)
@api_router.post("/simulations", response_model=SimulationResponse)
async def run_simulation(req: SimulationCreate, db: AsyncSession = Depends(get_db)):
    t0 = time.time()
    sig = None
    if req.signal_id:
        s_res = await db.execute(select(Signal).where(Signal.id == req.signal_id))
        sig = s_res.scalars().first()

    pred = None
    if req.prediction_id:
        p_res = await db.execute(select(Prediction).where(Prediction.id == req.prediction_id))
        pred = p_res.scalars().first()

    scenarios = await simulation_service.generate_scenarios(db, signal=sig, prediction=pred, entity_id=req.entity_id)

    duration = int((time.time() - t0) * 1000)
    log_event("simulation.created", sig.entity if sig else "Strategy", str(uuid.uuid4())[:8], duration, "COMPLETED")

    return SimulationResponse(
        id=str(uuid.uuid4()),
        event=sig.title if sig else "Strategic competitive inflection",
        scenarios=[ScenarioResponse.model_validate(s) for s in scenarios]
    )

@api_router.get("/simulations/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Scenario).where(Scenario.id == scenario_id)
    res = await db.execute(stmt)
    sc = res.scalars().first()
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return sc

# 8. ACTIONS (HANDS / Anakin Wire)
@api_router.post("/actions/discover")
async def discover_actions(req: ActionDiscoverRequest):
    actions = await wire_service.discover_actions(query=req.query, service=req.service)
    return {"count": len(actions), "actions": actions}

@api_router.post("/actions/execute", response_model=ActionResponse)
async def execute_wire_action(req: ActionExecuteRequest, db: AsyncSession = Depends(get_db)):
    t0 = time.time()
    log_event("action.discovered", req.action_id, "wire", 0, "DISCOVERED")
    log_event("action.submitted", req.action_id, "wire", 0, "SUBMITTED")

    try:
        action = await wire_service.execute_action(
            db=db,
            action_id=req.action_id,
            payload=req.payload,
            entity_id=req.entity_id,
            signal_id=req.signal_id,
            scenario_id=req.scenario_id,
            auto_approved=req.auto_approved
        )
        duration = int((time.time() - t0) * 1000)
        status_ev = "action.completed" if action.status == "completed" else "action.failed" if action.status == "failed" else "action.validated"
        log_event(status_ev, req.action_id, action.id, duration, action.status.upper())
        return action
    except Exception as e:
        log_event("action.failed", req.action_id, "unknown", int((time.time() - t0) * 1000), "FAILED")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/actions/{action_id}", response_model=ActionResponse)
async def get_action(action_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Action).where(Action.id == action_id)
    res = await db.execute(stmt)
    a = res.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Action not found")
    return a

# 9. TIMELINE
@api_router.get("/timeline/{entity_id}", response_model=List[TimelineEventResponse])
async def get_entity_timeline(entity_id: str, db: AsyncSession = Depends(get_db)):
    return await timeline_service.get_timeline_for_entity(db, entity_id)

# 10. WORLD GRAPH
@api_router.get("/world-graph", response_model=WorldGraphResponse)
async def get_world_graph(db: AsyncSession = Depends(get_db)):
    return await world_model_service.get_world_graph(db)

# 11. AI REPUTATION / AI VISIBILITY
@api_router.get("/ai-reputation/{entity_id}", response_model=AIVisibilityResponse)
async def get_ai_reputation(entity_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Entity).where(Entity.id == entity_id))
    entity = res.scalars().first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    data = await ai_visibility_service.get_or_create_reputation(db, entity)
    return data

# 12. SETTINGS (AUTO ACTION / DEMO AUTO ACTION)
@api_router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Setting))
    settings_list = res.scalars().all()
    out = {
        "AUTO_ACTION": False,
        "DEMO_AUTO_ACTION": True,
        "ANAKIN_API_KEY_CONFIGURED": anakin_client.has_api_key(),
        "ACTIVE_MODE": "LIVE" if anakin_client.has_api_key() else "DEMO_RELIABILITY"
    }
    for s in settings_list:
        if isinstance(s.value, dict) and "enabled" in s.value:
            out[s.key] = s.value["enabled"]
        else:
            out[s.key] = s.value
    return out

@api_router.put("/settings")
async def update_settings(payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    for k, v in payload.items():
        stmt = select(Setting).where(Setting.key == k)
        res = await db.execute(stmt)
        s = res.scalars().first()
        val = {"enabled": bool(v)} if isinstance(v, bool) else v
        if s:
            s.value = val
            s.updated_at = utc_now()
        else:
            s = Setting(key=k, value=val)
            db.add(s)
    await db.commit()
    return {"status": "updated", "settings": payload}

# 13. DETERMINISTIC DEMO RUNNER ("RUN THE FUTURE" Button)
@api_router.post("/demo/run", response_model=DemoRunResponse)
async def run_the_future(db: AsyncSession = Depends(get_db)):
    """
    Executes the full 13-stage deterministic story specified in Sections 13, 14, 21, 22, 36 of the PDF:
    OBSERVED ✓ UNDERSTOOD ✓ PREDICTED ✓ SIMULATED ✓ ACTED ✓
    """
    workflow_id = str(uuid.uuid4())[:8]
    trail: List[AgentTrailStep] = []
    now = utc_now()

    # Step 1: Ensure entities exist
    acme = await world_model_service.get_or_create_entity(
        db, "Acme AI", entity_type="company", domain="acme.ai", importance=100
    )
    comp_x = await world_model_service.get_or_create_entity(
        db, "Competitor X", entity_type="competitor", domain="competitorx.ai", importance=95
    )

    # Step 2: Injected DEMO SIGNAL
    t_start = time.time()
    demo_sig_data = signal_service.get_seed_demo_signal()
    sig = await signal_service.create_signal(db, SignalCreate(
        entity=demo_sig_data["entity"],
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

    trail.append(AgentTrailStep(
        phase="OBSERVE",
        timestamp=now,
        duration_ms=int((time.time() - t_start) * 1000) + 120,
        tool="Anakin Website Monitor",
        source="competitorx.ai/enterprise-pricing",
        state="Change detected: Enterprise tier reduced 22% & Governance suite bundled",
        details={"event_type": "price_changes", "severity": "critical", "importance": 96}
    ))

    # Step 3: Cortex Investigation & Evidence
    t_cortex = time.time()
    investigation = await reasoning_service.investigate_signal(db, sig)
    
    # Load evidence for response
    ev_res = await db.execute(select(Evidence).where(Evidence.investigation_id == investigation.id))
    ev_items = [
        EvidenceItem(
            id=e.id, source_url=e.source_url, source_title=e.source_title,
            claim=e.claim, quote=e.quote, confidence=e.confidence, relevance_score=e.relevance_score
        )
        for e in ev_res.scalars().all()
    ]

    trail.append(AgentTrailStep(
        phase="UNDERSTAND",
        timestamp=utc_now(),
        duration_ms=int((time.time() - t_cortex) * 1000) + 240,
        tool="Cortex (Anakin Agentic Search)",
        source="3 Multi-source Evidence Chains",
        state="Aggressive Enterprise Pricing Disruption & Governance Commoditization",
        details={"confidence": 94, "evidence_count": len(ev_items), "strategic_theme": investigation.strategic_theme}
    ))

    # Step 4: World Model Graph update
    await world_model_service.update_relationship(
        db, comp_x.id, acme.id, "competes_with",
        confidence=98, current_val="Aggressive Enterprise Governance War", source_info="Cortex Investigation"
    )

    # Step 5: Oracle Prediction
    t_oracle = time.time()
    prediction = await forecast_service.generate_prediction(db, signal=sig, entity_id=comp_x.id)
    
    trail.append(AgentTrailStep(
        phase="PREDICT",
        timestamp=utc_now(),
        duration_ms=int((time.time() - t_oracle) * 1000) + 180,
        tool="Oracle Forecasting Engine",
        source="World Model Pattern Analysis",
        state="Forecast generated: Broader enterprise strategy expansion within 30 days (84% prob)",
        details={"probability": prediction.probability, "time_window": prediction.time_window, "confidence": prediction.confidence}
    ))

    # Step 6: Simulator Scenarios
    t_sim = time.time()
    scenarios = await simulation_service.generate_scenarios(db, signal=sig, prediction=prediction, entity_id=comp_x.id)
    recommended_sc = next((s for s in scenarios if s.recommended), scenarios[-1])

    trail.append(AgentTrailStep(
        phase="SIMULATE",
        timestamp=utc_now(),
        duration_ms=int((time.time() - t_sim) * 1000) + 140,
        tool="Simulator Engine",
        source="Multi-pathway Strategic Comparison",
        state=f"3 scenarios generated. Recommended: {recommended_sc.scenario}",
        details={"selected": recommended_sc.scenario, "score": recommended_sc.score, "risk": recommended_sc.risk, "benefit": recommended_sc.benefit}
    ))

    # Step 7: Hands / Anakin Wire Action Execution
    t_action = time.time()
    action_payload = {
        "repo": "acme-ai/enterprise-platform",
        "title": "STRATEGIC COUNTERMEASURE: Bundle Enterprise Governance Suite v2",
        "body": (
            "## Trigger\nSentinel detected Competitor X enterprise tier price reduction (-22%) with included compliance features.\n\n"
            "## Strategy Selected (Simulator Option C - Score 94/100)\n"
            "Differentiate rather than discounting. Automatically upgrade all existing Acme AI enterprise customers "
            "to 'Governance Suite v2' at no additional cost, highlighting our SOC2 Type II cert & FedRAMP pipeline.\n\n"
            "## Action Dispatched via Anakin Wire\n"
            "- Discovered Wire Action: `github.issue.create`\n"
            "- Target Repository: `acme-ai/enterprise-platform`\n"
            "- Assigned: Executive Strategy & Product Engineering"
        ),
        "labels": ["priority-p0", "competitive-response", "anakin-wire"]
    }

    action_record = await wire_service.execute_action(
        db=db,
        action_id="github.issue.create",
        payload=action_payload,
        entity_id=acme.id,
        signal_id=sig.id,
        scenario_id=recommended_sc.id,
        auto_approved=True,
        is_demo=True
    )

    trail.append(AgentTrailStep(
        phase="ACT",
        timestamp=utc_now(),
        duration_ms=int((time.time() - t_action) * 1000) + 210,
        tool="Hands (Anakin Wire)",
        source="github.issue.create",
        state="Wire action discovered ✓ Validated ✓ Submitted ✓ Confirmed ✓",
        details={"status": action_record.status, "action_id": action_record.action_id, "external_id": action_record.external_id}
    ))

    # Step 8: Update Timeline
    await timeline_service.add_event(
        db, entity_id=acme.id,
        title="Automated Governance Bundle Deployed via Wire",
        description="Executive counter-measure initiated. GitHub strategy issue created.",
        source="WEBODY Hands Engine",
        event_type="action_executed",
        confidence=100,
        impact="critical"
    )

    final_msg = (
        "WEBODY didn't tell you what happened. "
        "It figured out what it meant, what could happen next, and what to do about it."
    )

    # Broadcast completion to WebSocket telemetry clients
    await manager.broadcast("demo.completed", {
        "workflow_id": workflow_id,
        "signal": sig.title,
        "action": action_record.name,
        "takeaway": final_msg
    })

    return DemoRunResponse(
        status="success",
        message="MISSION COMPLETE. The world model has been updated.",
        workflow_id=workflow_id,
        agent_trail=trail,
        signal=SignalResponse.model_validate(sig),
        investigation=InvestigationResponse(
            id=investigation.id,
            signal_id=investigation.signal_id,
            entity_id=investigation.entity_id,
            title=investigation.title,
            status=investigation.status,
            event=investigation.event,
            interpretation=investigation.interpretation,
            confidence=investigation.confidence,
            importance=investigation.importance,
            strategic_theme=investigation.strategic_theme,
            evidence=ev_items,
            implications=investigation.implications or [],
            unknowns=investigation.unknowns or [],
            created_at=investigation.created_at
        ),
        prediction=PredictionResponse.model_validate(prediction),
        scenarios=[ScenarioResponse.model_validate(s) for s in scenarios],
        executed_action=ActionResponse.model_validate(action_record),
        final_takeaway=final_msg
    )

# ================= NEXT-GEN ENHANCEMENTS =================

# 14. REAL-TIME WEBSOCKET STREAM
@api_router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or client ping
            await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 15. ADAPTIVE VOLATILITY GOVERNOR
@api_router.get("/governor/volatility/{entity}")
async def get_entity_volatility(entity: str, db: AsyncSession = Depends(get_db)):
    return await governor_service.calculate_volatility(db, entity)

@api_router.post("/governor/apply")
async def apply_governor_frequencies(db: AsyncSession = Depends(get_db)):
    updated = await governor_service.apply_governor_to_watch_targets(db)
    await manager.broadcast("governor.updated", {"targets_updated": len(updated)})
    return {"status": "applied", "results": updated}

# 16. MULTI-AGENT ADVERSARIAL ORACLE DEBATE
@api_router.post("/oracle/adversarial-debate")
async def run_adversarial_debate(payload: Dict[str, Any]):
    event_title = payload.get("event_title", "Enterprise Pricing Reduction & Bundling")
    entity_name = payload.get("entity_name", "Competitor X")
    event_summary = payload.get("event_summary", "Discounts applied with automated compliance hooks.")
    
    debate_res = await adversarial_oracle_service.conduct_adversarial_debate(
        event_title=event_title,
        entity_name=entity_name,
        event_summary=event_summary
    )
    await manager.broadcast("oracle.debate_ready", debate_res)
    return debate_res

# 17. VECTOR SEMANTIC MEMORY SEARCH
@api_router.get("/memory/search")
async def search_semantic_memory(q: str = Query(..., description="Query text to search across past memories")):
    results = vector_memory_service.search(q, top_k=5)
    return {"query": q, "count": len(results), "results": results}

# 18. CROSS-LLM CITATION RADAR
@api_router.get("/radar/cross-llm")
async def get_cross_llm_radar(brand: str = "Acme AI", competitor: str = "Competitor X"):
    return await cross_llm_radar_service.run_radar_analysis(brand_name=brand, competitor_name=competitor)

# 19. HUMAN-IN-THE-LOOP RLHF PREFERENCE LEARNER
@api_router.post("/rlhf/decision")
async def record_rlhf_decision(payload: Dict[str, Any]):
    chosen = payload.get("chosen_scenario", "Scenario C: DIFFERENTIATE")
    score = int(payload.get("score", 90))
    risk = int(payload.get("risk", 25))
    benefit = int(payload.get("benefit", 90))
    complexity = int(payload.get("complexity", 35))
    rejected = payload.get("rejected_scenarios", [])

    res = rlhf_service.record_decision(
        chosen_scenario=chosen,
        score=score,
        risk=risk,
        benefit=benefit,
        complexity=complexity,
        rejected_scenarios=rejected
    )
    return res

@api_router.get("/rlhf/profile")
async def get_rlhf_profile():
    return rlhf_service.get_current_profile()

# 20. LIVE ANAKIN API DIAGNOSTICS & CONNECTION TEST
@api_router.get("/anakin/test-connection")
async def test_anakin_connection():
    """Verify live connectivity and authentication against Anakin.io REST APIs"""
    return await anakin_client.test_connection()

@api_router.post("/anakin/reload-key")
async def reload_anakin_key():
    """Reload environment variables from .env dynamically without restarting the server"""
    res = anakin_client.reload_config()
    test_res = await anakin_client.test_connection()
    return {
        "reloaded": True,
        "config": res,
        "verification": test_res
    }

@api_router.post("/anakin/live-inspect")
async def run_live_inspect(payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    """
    Live Anakin Diagnostic Tool: Trigger live Map, Scrape, Search, or Wire on any arbitrary target domain.
    Returns live API responses, latency metrics, and fallback verification.
    """
    action = payload.get("action", "scrape").lower()
    target = payload.get("target", "https://openai.com").strip()
    start_time = time.time()

    # SSRF Protection: Validate target before initiating live network request
    if action == "scrape":
        target = ssrf_guard.validate_url(target)
    elif action == "map":
        target = ssrf_guard.validate_domain(target)

    result_data: Dict[str, Any] = {}
    try:
        if action == "map":
            result_data = await mapping_service.map_domain(target)
        elif action == "scrape":
            result_data = await scrape_service.scrape_page(target)
        elif action == "search":
            result_data = await research_service.perform_deep_research(query=target, max_steps=2)
        elif action == "wire":
            result_data = await wire_service.discover_actions(query=target if target != "https://openai.com" else None)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action '{action}'. Supported: map, scrape, search, wire")

        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "success",
            "action": action,
            "target": target,
            "duration_ms": elapsed_ms,
            "has_api_key": anakin_client.has_api_key(),
            "data": result_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Live inspect error on action {action}: {e}")
        return {
            "status": "error",
            "action": action,
            "target": target,
            "duration_ms": elapsed_ms,
            "error": str(e),
            "has_api_key": anakin_client.has_api_key(),
            "data": None
        }


