export interface GraphNode {
  id: string;
  name?: string;
  label?: string;
  type: string;
  domain?: string;
  description?: string;
  status: string;
  importance: number;
  metadata?: Record<string, any>;
  meta_data?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  relationship?: string;
  confidence: number;
  current_value?: string;
  previous_value?: string;
  observed_at?: string;
}

export interface WorldGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updated_at?: string;
}

export interface Signal {
  id: string;
  entity: string;
  entity_id?: string;
  source: string;
  url: string;
  timestamp: string;
  event_type: string;
  title: string;
  summary: string;
  content?: string;
  importance: number;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  actionability: string;
  is_demo: boolean;
  created_at: string;
}

export interface EvidenceItem {
  id?: string;
  source_url: string;
  source_title: string;
  claim: string;
  quote?: string;
  confidence: number;
  relevance_score: number;
}

export interface Investigation {
  id: string;
  signal_id?: string;
  entity_id?: string;
  title: string;
  status: string;
  event: string;
  interpretation: string;
  confidence: number;
  importance: number;
  strategic_theme: string;
  evidence: EvidenceItem[];
  implications: string[];
  unknowns: string[];
  created_at: string;
}

export interface Prediction {
  id: string;
  entity_id?: string;
  signal_id?: string;
  prediction: string;
  probability: number;
  time_window: string;
  confidence: number;
  supporting_signals: string[];
  contradicting_signals: string[];
  reasoning: string;
  created_at: string;
}

export interface Scenario {
  id: string;
  scenario: string;
  score: number;
  risk: number;
  benefit: number;
  complexity: number;
  reasoning: string;
  recommended: boolean;
}

export interface Simulation {
  id: string;
  event: string;
  scenarios: Scenario[];
}

export interface Action {
  id: string;
  action_id: string;
  name: string;
  status: "discovered" | "validated" | "submitted" | "running" | "completed" | "failed";
  payload: Record<string, any>;
  approval_required: boolean;
  approved: boolean;
  external_id?: string;
  execution_result?: any;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  entity_id: string;
  timestamp: string;
  title: string;
  description?: string;
  source: string;
  event_type: string;
  confidence: number;
  impact: string;
}

export interface AIVisibility {
  entity_id: string;
  entity_name: string;
  brand_mentions: number;
  competitor_mentions: number;
  recommendation_patterns: string[];
  emerging_associations: string[];
  citation_patterns: string[];
  trend_changes: Record<string, any>;
}

export interface WatchTarget {
  id: string;
  name: string;
  entity_type: string;
  url: string;
  category: string;
  importance: number;
  monitoring_frequency: string;
  enabled: boolean;
  last_checked?: string;
  created_at: string;
}

export interface AgentTrailStep {
  phase: "OBSERVE" | "UNDERSTAND" | "PREDICT" | "SIMULATE" | "ACT";
  timestamp: string;
  duration_ms: number;
  tool: string;
  source: string;
  state: string;
  details?: Record<string, any>;
}

export interface DemoRunResponse {
  status: string;
  message: string;
  workflow_id: string;
  agent_trail: AgentTrailStep[];
  signal: Signal;
  investigation: Investigation;
  prediction: Prediction;
  scenarios: Scenario[];
  executed_action: Action;
  final_takeaway: string;
}

export interface Settings {
  AUTO_ACTION: boolean;
  DEMO_AUTO_ACTION: boolean;
  ANAKIN_API_KEY_CONFIGURED: boolean;
  ACTIVE_MODE: string;
  [key: string]: any;
}
