import {
  WorldGraph,
  Signal,
  Investigation,
  Prediction,
  Simulation,
  Scenario,
  Action,
  TimelineEvent,
  AIVisibility,
  WatchTarget,
  DemoRunResponse,
  Settings
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `API Error ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        const errText = await res.text();
        if (errText) errMsg = errText;
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error("Unable to reach WEBODY backend service. Please verify server is running on port 8000.");
    }
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; anakin_status: string; modules: string[] }>("/health"),

  // World Model
  getWorldGraph: () => request<WorldGraph>("/api/world-graph"),
  getEntities: () => request<any[]>("/api/entities"),
  getEntityProfile: (id: string) => request<any>(`/api/entities/${id}`),

  // Sentinel Signals & Watch Targets
  getSignals: () => request<Signal[]>("/api/signals"),
  injectDemoSignal: () => request<Signal>("/api/signals/demo", { method: "POST" }),
  getWatchTargets: () => request<WatchTarget[]>("/api/watch-targets"),
  createWatchTarget: (data: Partial<WatchTarget>) =>
    request<WatchTarget>("/api/watch-targets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Cartographer Map
  mapDomain: (domain: string, max_pages = 25) =>
    request<any>("/api/map", {
      method: "POST",
      body: JSON.stringify({ domain, max_pages }),
    }),

  // Cortex Reasoning / "WHY SHOULD I CARE?"
  investigateSignal: (signal_id: string) =>
    request<Investigation>("/api/investigations", {
      method: "POST",
      body: JSON.stringify({ signal_id }),
    }),
  getInvestigation: (id: string) => request<Investigation>(`/api/investigations/${id}`),

  // Oracle Forecast / "WHAT HAPPENS NEXT?"
  createPrediction: (signal_id?: string, entity_id?: string) =>
    request<Prediction>("/api/predictions", {
      method: "POST",
      body: JSON.stringify({ signal_id, entity_id }),
    }),
  getPredictions: () => request<Prediction[]>("/api/predictions"),

  // Simulator Scenarios / "WHAT CAN WE DO?"
  createSimulation: (signal_id?: string, prediction_id?: string, entity_id?: string) =>
    request<Simulation>("/api/simulations", {
      method: "POST",
      body: JSON.stringify({ signal_id, prediction_id, entity_id }),
    }),

  // Hands / Wire Actions
  discoverActions: (query?: string, service?: string) =>
    request<{ count: number; actions: any[] }>("/api/actions/discover", {
      method: "POST",
      body: JSON.stringify({ query, service }),
    }),
  executeAction: (data: {
    action_id: string;
    payload: Record<string, any>;
    entity_id?: string;
    signal_id?: string;
    scenario_id?: string;
    auto_approved?: boolean;
  }) =>
    request<Action>("/api/actions/execute", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAction: (id: string) => request<Action>(`/api/actions/${id}`),

  // Timeline
  getTimeline: (entity_id: string) => request<TimelineEvent[]>(`/api/timeline/${entity_id}`),

  // AI Reputation
  getAIReputation: (entity_id: string) => request<AIVisibility>(`/api/ai-reputation/${entity_id}`),

  // Settings
  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (settings: Partial<Settings>) =>
    request<any>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),

  // Deterministic Demo Runner ("RUN THE FUTURE")
  runDeterministicDemo: () =>
    request<DemoRunResponse>("/api/demo/run", {
      method: "POST",
    }),

  // Next-Gen Enhancements
  getGovernorVolatility: (entity: string) =>
    request<any>(`/api/governor/volatility/${entity}`),
  applyGovernor: () =>
    request<any>("/api/governor/apply", { method: "POST" }),
  runAdversarialDebate: (event_title: string, entity_name: string, event_summary: string) =>
    request<any>("/api/oracle/adversarial-debate", {
      method: "POST",
      body: JSON.stringify({ event_title, entity_name, event_summary }),
    }),
  searchMemory: (query: string) =>
    request<any>(`/api/memory/search?q=${encodeURIComponent(query)}`),
  getCrossLLMRadar: (brand = "Acme AI", competitor = "Competitor X") =>
    request<any>(`/api/radar/cross-llm?brand=${encodeURIComponent(brand)}&competitor=${encodeURIComponent(competitor)}`),
  recordRLHFDecision: (payload: {
    chosen_scenario: string;
    score: number;
    risk: number;
    benefit: number;
    complexity: number;
    rejected_scenarios?: string[];
  }) =>
    request<any>("/api/rlhf/decision", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRLHFProfile: () => request<any>("/api/rlhf/profile"),

  // Live Anakin Diagnostics
  testAnakinConnection: () => request<any>("/api/anakin/test-connection"),
  reloadAnakinKey: () => request<any>("/api/anakin/reload-key", { method: "POST" }),
  liveInspectAnakin: (action: string, target: string) =>
    request<any>("/api/anakin/live-inspect", {
      method: "POST",
      body: JSON.stringify({ action, target }),
    }),
};


