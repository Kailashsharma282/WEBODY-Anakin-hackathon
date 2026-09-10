from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# Watch Targets
class WatchTargetCreate(BaseModel):
    name: str
    entity_type: str = "company"
    url: str
    category: str = "COMPETITOR"
    importance: int = Field(default=50, ge=0, le=100)
    monitoring_frequency: str = "hourly"
    enabled: bool = True

class WatchTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    entity_type: str
    url: str
    category: str
    importance: int
    monitoring_frequency: str
    enabled: bool
    last_checked: Optional[datetime] = None
    created_at: datetime

# Map / Cartographer
class MapDomainRequest(BaseModel):
    domain: str
    url: Optional[str] = None
    crawl_depth: int = 1
    max_pages: int = 25

class PageTopologyItem(BaseModel):
    url: str
    page_category: str
    title: Optional[str] = None
    status: str = "discovered"
    summary: Optional[str] = None
    importance: int = 50
    extracted_entities: List[str] = []

class MapDomainResponse(BaseModel):
    domain: str
    total_discovered: int
    categories: Dict[str, int]
    pages: List[PageTopologyItem]
    live_anakin_used: bool = False

# Entities
class EntityBase(BaseModel):
    name: str
    entity_type: str
    domain: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"
    importance: int = 50
    meta_data: Dict[str, Any] = {}

class EntityCreate(EntityBase):
    pass

class EntityResponse(EntityBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime

# Signals (Sentinel)
class SignalCreate(BaseModel):
    entity: str
    source: str
    url: str
    event_type: str
    title: str
    summary: str
    content: Optional[str] = None
    importance: int = Field(default=50, ge=0, le=100)
    severity: str = "medium"
    confidence: int = Field(default=80, ge=0, le=100)
    actionability: str = "high"
    is_demo: bool = False
    entity_id: Optional[str] = None

class SignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity: str
    source: str
    url: str
    timestamp: datetime
    event_type: str
    title: str
    summary: str
    content: Optional[str] = None
    importance: int
    severity: str
    confidence: int
    actionability: str
    is_demo: bool
    entity_id: Optional[str] = None
    created_at: datetime

# Evidence
class EvidenceItem(BaseModel):
    id: Optional[str] = None
    source_url: str
    source_title: str
    claim: str
    quote: Optional[str] = None
    confidence: int = 85
    relevance_score: int = 90

# Cortex Investigation ("WHY SHOULD I CARE?")
class InvestigationCreate(BaseModel):
    signal_id: str

class InvestigationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    signal_id: Optional[str] = None
    entity_id: Optional[str] = None
    title: str
    status: str
    event: str
    interpretation: str
    confidence: int
    importance: int
    strategic_theme: str
    evidence: List[EvidenceItem]
    implications: List[str]
    unknowns: List[str]
    created_at: datetime

# Oracle Forecasting ("WHAT HAPPENS NEXT?")
class PredictionCreate(BaseModel):
    entity_id: Optional[str] = None
    signal_id: Optional[str] = None

class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_id: Optional[str] = None
    signal_id: Optional[str] = None
    prediction: str
    probability: int = Field(ge=0, le=100)
    time_window: str
    confidence: int = Field(ge=0, le=100)
    supporting_signals: List[str]
    contradicting_signals: List[str]
    reasoning: str
    created_at: datetime

# Simulator Scenarios ("WHAT CAN WE DO?")
class SimulationCreate(BaseModel):
    signal_id: Optional[str] = None
    prediction_id: Optional[str] = None
    entity_id: Optional[str] = None

class ScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario: str
    score: int = Field(ge=0, le=100)
    risk: int = Field(ge=0, le=100)
    benefit: int = Field(ge=0, le=100)
    complexity: int = Field(ge=0, le=100)
    reasoning: str
    recommended: bool = False

class SimulationResponse(BaseModel):
    id: str
    event: str
    scenarios: List[ScenarioResponse]

# Hands / Anakin Wire Actions
class WireActionSchema(BaseModel):
    action_id: str
    name: str
    description: str
    service: str
    required_inputs: List[str]
    input_schema: Dict[str, Any]

class ActionDiscoverRequest(BaseModel):
    query: Optional[str] = None
    service: Optional[str] = None

class ActionExecuteRequest(BaseModel):
    action_id: str
    payload: Dict[str, Any]
    entity_id: Optional[str] = None
    signal_id: Optional[str] = None
    scenario_id: Optional[str] = None
    auto_approved: bool = False

class ActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action_id: str
    action_type: str
    name: str
    status: str
    approval_required: bool
    approved: bool
    payload: Dict[str, Any]
    execution_result: Optional[Dict[str, Any]] = None
    external_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Timeline Event
class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_id: str
    timestamp: datetime
    title: str
    description: Optional[str] = None
    source: str
    event_type: str
    confidence: int
    impact: str
    created_at: datetime

# World Graph
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    status: str
    importance: int
    meta_data: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    confidence: int
    current_value: Optional[str] = None
    previous_value: Optional[str] = None

class WorldGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# AI Visibility
class AIVisibilityResponse(BaseModel):
    entity_id: str
    entity_name: str
    brand_mentions: int
    competitor_mentions: int
    recommendation_patterns: List[str]
    emerging_associations: List[str]
    citation_patterns: List[str]
    trend_changes: Dict[str, Any]
    observed_at: datetime

# Agent Trail
class AgentTrailStep(BaseModel):
    phase: str
    timestamp: datetime
    duration_ms: int
    tool: str
    source: str
    state: str
    details: Dict[str, Any] = {}

# Demo Run
class DemoRunResponse(BaseModel):
    status: str
    message: str
    workflow_id: str
    agent_trail: List[AgentTrailStep]
    signal: SignalResponse
    investigation: InvestigationResponse
    prediction: PredictionResponse
    scenarios: List[ScenarioResponse]
    executed_action: ActionResponse
    final_takeaway: str
