"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  WorldGraph,
  Signal,
  Investigation,
  Prediction,
  Scenario,
  Action,
  TimelineEvent,
  AIVisibility,
  WatchTarget,
  Settings,
  GraphNode,
  AgentTrailStep,
  DemoRunResponse
} from "../lib/types";
import { api } from "../lib/api";

// Reusable Components
import { SystemMetric } from "../components/SystemMetric";
import { WorldGraph as WorldGraphComponent } from "../components/WorldGraph";
import { SignalCard } from "../components/SignalCard";
import { EntityCard } from "../components/EntityCard";
import { Timeline } from "../components/Timeline";
import { PredictionCard } from "../components/PredictionCard";
import { ScenarioCard } from "../components/ScenarioCard";
import { AgentTrail } from "../components/AgentTrail";
import { ActionExecution } from "../components/ActionExecution";
import { EvidencePanel } from "../components/EvidencePanel";
import { DependencyMap } from "../components/DependencyMap";
import { NextGenHub } from "../components/NextGenHub";
import { AnakinInspector } from "../components/AnakinInspector";
import { SentinelDiffModal } from "../components/SentinelDiffModal";
import { IntelligenceTicker } from "../components/IntelligenceTicker";
import { ScenarioSimulatorControls } from "../components/ScenarioSimulatorControls";
import { WarRoomSimulator } from "../components/WarRoomSimulator";
import { WireActionDispatcher } from "../components/WireActionDispatcher";
import { CryptographicAuditModal } from "../components/CryptographicAuditModal";


// Icons
import {
  Globe,
  Radio,
  Eye,
  FolderTree,
  TrendingUp,
  SlidersHorizontal,
  Zap,
  Clock,
  Sparkles,
  Settings as SettingsIcon,
  Play,
  RotateCw,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Layers,
  Award,
  ExternalLink,
  Plus,
  Compass,
  FileCheck,
  Brain,
  Terminal,
  Volume2,
  VolumeX,
  FileDown,
  Activity,
  Split
} from "lucide-react";


const INITIAL_NODES: GraphNode[] = [
  { id: "node-anthropic", name: "Anthropic", label: "Anthropic", type: "company", importance: 100, status: "active", domain: "anthropic.com", description: "Our primary monitored business: Claude frontier reasoning models and Enterprise AI platform." },
  { id: "node-openai", name: "OpenAI", label: "OpenAI", type: "competitor", importance: 95, status: "active", domain: "openai.com", description: "Frontier competitor operating ChatGPT Enterprise and GPT-4o/o1 reasoning frontier." },
  { id: "node-deepmind", name: "Google DeepMind", label: "Google DeepMind", type: "competitor", importance: 92, status: "active", domain: "deepmind.google", description: "Frontier research lab deploying Gemini 2.0 multimodal models." },
  { id: "node-aws", name: "AWS Bedrock", label: "AWS Bedrock", type: "vendor", importance: 90, status: "active", domain: "aws.amazon.com", description: "Primary cloud compute and Bedrock foundation model provider." },
  { id: "node-mistral", name: "Mistral AI", label: "Mistral AI", type: "competitor", importance: 82, status: "active", domain: "mistral.ai", description: "European frontier model provider with open-weight enterprise models." },
  { id: "node-eu-reg", name: "EU AI Office", label: "EU AI Office", type: "regulator", importance: 88, status: "active", domain: "digital-strategy.ec.europa.eu", description: "Article 52/53 General Purpose AI governance enforcement body." },
  { id: "node-enterprise", name: "Enterprise Market", label: "Enterprise Market", type: "marketplace", importance: 86, status: "active", domain: "enterprise.market", description: "Target Fortune 500 and Global 2000 AI procurement pipeline." },
];

const INITIAL_EDGES = [
  { id: "edge-1", source: "node-openai", target: "node-anthropic", type: "competes_with", confidence: 98, current_value: "Frontier Enterprise Price & Capability War" },
  { id: "edge-2", source: "node-anthropic", target: "node-aws", type: "depends_on", confidence: 95, current_value: "GPU Cluster & Bedrock APIs" },
  { id: "edge-3", source: "node-anthropic", target: "node-eu-reg", type: "targets", confidence: 90, current_value: "EU AI Act Article 52 Compliance" },
  { id: "edge-4", source: "node-deepmind", target: "node-openai", type: "competes_with", confidence: 94, current_value: "Frontier Reasoning Race" },
  { id: "edge-5", source: "node-anthropic", target: "node-enterprise", type: "sells", confidence: 96, current_value: "Claude Enterprise ARR" },
  { id: "edge-6", source: "node-openai", target: "node-enterprise", type: "targets", confidence: 92, current_value: "Enterprise Accounts Defense" },
  { id: "edge-7", source: "node-mistral", target: "node-anthropic", type: "competes_with", confidence: 85, current_value: "European Market Share" },
];

const INITIAL_SIGNALS: Signal[] = [
  {
    id: "sig-openai-1",
    entity: "OpenAI",
    source: "Anakin Live Crawl: openai.com/api/pricing",
    url: "https://openai.com/api/pricing",
    timestamp: new Date().toISOString(),
    event_type: "price_changes",
    title: "OpenAI Slashes GPT-4o API Pricing by 50% with Prompt Caching",
    summary: "Live Sentinel crawl detected token discount on cached input prompts and increased rate limits across enterprise developer tiers.",
    content: "Full crawl diff: Input token rates discounted 50% on cached prompts. Batch API discounts expanded to 50% across Tier 4 and Tier 5 enterprise accounts.",
    importance: 96,
    severity: "critical",
    confidence: 0.98,
    actionability: "high",
    is_demo: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "sig-anthropic-1",
    entity: "Anthropic",
    source: "Anakin Monitor: anthropic.com/news",
    url: "https://anthropic.com/news",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event_type: "feature_additions",
    title: "Anthropic Claude 3.7 Sonnet Hybrid Reasoning Model Deployed",
    summary: "Hybrid reasoning architecture achieving benchmark leadership in software engineering, complex tool-calling, and compliance evaluation.",
    content: "Claude 3.7 Sonnet introduces granular thinking token budget controls, allowing enterprises to dynamically dial reasoning depth.",
    importance: 92,
    severity: "high",
    confidence: 0.96,
    actionability: "high",
    is_demo: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "sig-eu-1",
    entity: "EU AI Office",
    source: "Anakin Monitor: digital-strategy.ec.europa.eu",
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    event_type: "policy_changes",
    title: "EU AI Office Enacts General-Purpose AI Code of Practice & Transparency Rules",
    summary: "Mandatory model provenance, watermark attestation, and systemic risk mitigation frameworks established under EU AI Act Chapter V.",
    content: "General-Purpose AI model providers must furnish verifiable technical documentation, copyright policies, and systemic risk assessments.",
    importance: 90,
    severity: "high",
    confidence: 0.95,
    actionability: "high",
    is_demo: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "sig-deepmind-1",
    entity: "Google DeepMind",
    source: "Anakin Monitor: deepmind.google/technologies/gemini",
    url: "https://deepmind.google/technologies/gemini/",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    event_type: "model_release",
    title: "DeepMind Releases Gemini 2.0 Flash Thinking with Native Multimodality",
    summary: "Sub-second multimodal reasoning model launched on Google AI Studio and Vertex AI targeting real-time agentic execution.",
    content: "Frontier multimodal reasoning latency reduced by 40% with native tool calling and spatial reasoning integration.",
    importance: 86,
    severity: "medium",
    confidence: 0.94,
    actionability: "medium",
    is_demo: false,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  }
];

const INITIAL_PREDICTIONS: Prediction[] = [
  {
    id: "pred-canonical-1",
    signal_id: "sig-openai-1",
    entity_id: "node-openai",
    prediction: "OpenAI pricing discounts will accelerate multi-provider enterprise migration within 45 days",
    probability: 0.88,
    confidence: 0.88,
    time_window: "45 days",
    supporting_signals: ["sig-openai-1", "sig-anthropic-1"],
    contradicting_signals: [],
    reasoning: "Aggressive prompt caching discounts will pressure enterprises to build multi-model router infrastructure rather than standardizing on single-vendor stacks.",
    created_at: new Date().toISOString()
  },
  {
    id: "pred-canonical-2",
    signal_id: "sig-eu-1",
    entity_id: "node-eu-reg",
    prediction: "Enterprise procurement RFPs will mandate cryptographic model provenance within 60 days",
    probability: 0.92,
    confidence: 0.92,
    time_window: "60 days",
    supporting_signals: ["sig-eu-1"],
    contradicting_signals: [],
    reasoning: "EU AI Act regulatory enforcement mandates transparent supply chain documentation. Tier 1 European enterprises are freezing vendor selection without audit proofs.",
    created_at: new Date().toISOString()
  },
  {
    id: "pred-canonical-3",
    signal_id: "sig-anthropic-1",
    entity_id: "node-anthropic",
    prediction: "Hybrid reasoning models will become primary requirement in Tier-1 software engineering RFPs",
    probability: 0.84,
    confidence: 0.84,
    time_window: "30 days",
    supporting_signals: ["sig-anthropic-1"],
    contradicting_signals: [],
    reasoning: "Dynamically tunable thinking tokens provide cost-performance Pareto improvements that fixed latency models cannot match.",
    created_at: new Date().toISOString()
  }
];

const INITIAL_SCENARIOS: Scenario[] = [
  {
    id: "sc-1",
    scenario: "DIFFERENTIATE ON HIGH-ASSURANCE HYBRID REASONING & EU GOVERNANCE",
    score: 94,
    benefit: 88,
    risk: 12,
    complexity: 25,
    recommended: true,
    reasoning: "Position Anthropic Claude as the verifiable enterprise platform with tamper-evident audit guarantees, dedicated prompt caching, and EU AI Act compliance."
  },
  {
    id: "sc-2",
    scenario: "MATCH PRICE CUTS DIRECTLY ACROSS FRONTIER TIERS",
    score: 64,
    benefit: 32,
    risk: 68,
    complexity: 42,
    recommended: false,
    reasoning: "Direct price matching triggers destructive race-to-the-bottom margin erosion without reinforcing technological differentiation."
  },
  {
    id: "sc-3",
    scenario: "ENTERPRISE CACHE BUNDLE: GUARANTEED PROMPT CACHING WITH MULTI-YEAR ARR",
    score: 84,
    benefit: 68,
    risk: 20,
    complexity: 34,
    recommended: false,
    reasoning: "Protects annual contract value by trading bundled prompt caching latency SLA for multi-year customer commitments."
  }
];

const INITIAL_WATCH_TARGETS: WatchTarget[] = [
  {
    id: "wt-1",
    name: "OpenAI API Pricing & Token Tiers",
    entity_type: "pricing_page",
    url: "https://openai.com/api/pricing",
    category: "PRICING",
    importance: 98,
    monitoring_frequency: "hourly",
    enabled: true,
    created_at: new Date().toISOString()
  },
  {
    id: "wt-2",
    name: "Anthropic Claude Platform Documentation",
    entity_type: "documentation",
    url: "https://docs.anthropic.com",
    category: "DOCUMENTATION",
    importance: 94,
    monitoring_frequency: "hourly",
    enabled: true,
    created_at: new Date().toISOString()
  },
  {
    id: "wt-3",
    name: "EU AI Office Official Repository",
    entity_type: "regulatory_portal",
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    category: "REGULATORY",
    importance: 92,
    monitoring_frequency: "daily",
    enabled: true,
    created_at: new Date().toISOString()
  },
  {
    id: "wt-4",
    name: "Google DeepMind Research Publications",
    entity_type: "research_feed",
    url: "https://deepmind.google/research/",
    category: "RESEARCH",
    importance: 88,
    monitoring_frequency: "daily",
    enabled: true,
    created_at: new Date().toISOString()
  }
];

export default function Dashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("WORLD");

  // World Graph & Telemetry
  const [graphData, setGraphData] = useState<WorldGraph>({
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    updated_at: new Date().toISOString(),
  });
  const [signals, setSignals] = useState<Signal[]>(INITIAL_SIGNALS);
  const [predictions, setPredictions] = useState<Prediction[]>(INITIAL_PREDICTIONS);
  const [watchTargets, setWatchTargets] = useState<WatchTarget[]>(INITIAL_WATCH_TARGETS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [aiReputation, setAiReputation] = useState<AIVisibility | null>(null);
  const [settings, setSettings] = useState<Settings>({
    AUTO_ACTION: false,
    DEMO_AUTO_ACTION: false,
    ANAKIN_API_KEY_CONFIGURED: true,
    ACTIVE_MODE: "LIVE",
  });

  // Modal / Drawer States
  const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [activeSimulationScenarios, setActiveSimulationScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeExecutedAction, setActiveExecutedAction] = useState<Action | null>(null);
  const [agentTrail, setAgentTrail] = useState<AgentTrailStep[]>([]);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [selectedRivalry, setSelectedRivalry] = useState<string>("frontier_ai");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Loading & Execution States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoTakeaway, setDemoTakeaway] = useState<string | null>(null);
  const [investigatingSignalId, setInvestigatingSignalId] = useState<string | null>(null);
  const [predictingSignalId, setPredictingSignalId] = useState<string | null>(null);
  const [simulatingSignalId, setSimulatingSignalId] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // Initial Data Fetching
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [graph, sigs, preds, targets, sett] = await Promise.all([
        api.getWorldGraph().catch(() => ({ nodes: [], edges: [], updated_at: "" })),
        api.getSignals().catch(() => []),
        api.getPredictions().catch(() => []),
        api.getWatchTargets().catch(() => []),
        api.getSettings().catch(() => ({
          AUTO_ACTION: false,
          DEMO_AUTO_ACTION: false,
          ANAKIN_API_KEY_CONFIGURED: true,
          ACTIVE_MODE: "LIVE",
        })),
      ]);

      if (graph && graph.nodes && graph.nodes.length > 0) {
        setGraphData(graph);
      }
      if (sigs && sigs.length > 0) {
        setSignals(sigs);
      }
      if (preds && preds.length > 0) {
        setPredictions(preds);
      }
      if (targets && targets.length > 0) {
        setWatchTargets(targets);
      }
      if (sett) {
        setSettings(sett);
      }

      // Fetch primary target entity timeline and AI reputation if exists
      const primaryTarget = (graph && graph.nodes) ? (graph.nodes.find((n) => (n.name || n.label || "").toLowerCase().includes("openai")) || graph.nodes[0]) : null;
      if (primaryTarget) {
        const [tl, ai] = await Promise.all([
          api.getTimeline(primaryTarget.id).catch(() => []),
          api.getAIReputation(primaryTarget.id).catch(() => null),
        ]);
        setTimelineEvents(tl);
        setAiReputation(ai);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Establish WebSocket real-time telemetry stream with dynamic port & auto-reconnect
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || "8008";
    const defaultWs = typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname || "127.0.0.1"}:${wsPort}/api/ws/telemetry`
      : `ws://127.0.0.1:${wsPort}/api/ws/telemetry`;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || defaultWs;

    let ws: WebSocket | null = null;
    let heartbeatInterval: any = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          setIsWsConnected(true);
          heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const packet = JSON.parse(event.data);
            if (
              packet.type === "governor.updated" ||
              packet.type === "demo.completed" ||
              packet.type === "signal.detected" ||
              packet.type === "world.updated"
            ) {
              fetchAllData();
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          if (ws) ws.close();
        };
      } catch (e) {
        setIsWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Section 21 & 36: One-Click Deterministic Demo ("RUN THE FUTURE")
  const handleRunTheFuture = async () => {
    setIsDemoRunning(true);
    setDemoTakeaway(null);
    try {
      const demoRes: DemoRunResponse = await api.runDeterministicDemo(selectedRivalry);

      // Update State with Demo Artifacts
      setAgentTrail(demoRes.agent_trail);
      setSignals((prev) => [demoRes.signal, ...prev]);
      setActiveInvestigation(demoRes.investigation);
      setPredictions((prev) => [demoRes.prediction, ...prev]);
      setActiveSimulationScenarios(demoRes.scenarios);
      setActiveExecutedAction(demoRes.executed_action);
      setDemoTakeaway(demoRes.final_takeaway);

      // Refresh World Graph & Timeline
      const updatedGraph = await api.getWorldGraph().catch(() => graphData);
      setGraphData(updatedGraph);

      const compX = updatedGraph.nodes.find((n) => (n.name || n.label || "").toLowerCase().includes("competitor"));
      if (compX) {
        const tl = await api.getTimeline(compX.id).catch(() => []);
        setTimelineEvents(tl);
      }
    } catch (err) {
      console.error("Error running deterministic demo:", err);
    } finally {
      setIsDemoRunning(false);
    }
  };

  // Section 17: WHY SHOULD I CARE? (Cortex)
  const handleWhyShouldICare = async (sig: Signal) => {
    setInvestigatingSignalId(sig.id);
    try {
      const inv = await api.investigateSignal(sig.id);
      setActiveInvestigation(inv);
    } catch (err) {
      console.error("Error running investigation:", err);
    } finally {
      setInvestigatingSignalId(null);
    }
  };

  // Section 18: WHAT HAPPENS NEXT? (Oracle)
  const handleWhatHappensNext = async (sig: Signal) => {
    setPredictingSignalId(sig.id);
    try {
      const pred = await api.createPrediction(sig.id, sig.entity_id);
      setPredictions((prev) => [pred, ...prev]);
      setActiveTab("PREDICTIONS");
    } catch (err) {
      console.error("Error creating prediction:", err);
    } finally {
      setPredictingSignalId(null);
    }
  };

  // Section 19: WHAT CAN WE DO? (Simulator)
  const handleWhatCanWeDo = async (sig: Signal) => {
    setSimulatingSignalId(sig.id);
    try {
      const sim = await api.createSimulation(sig.id, undefined, sig.entity_id);
      setActiveSimulationScenarios(sim.scenarios);
      setActiveTab("SIMULATIONS");
    } catch (err) {
      console.error("Error generating simulation:", err);
    } finally {
      setSimulatingSignalId(null);
    }
  };

  // Handle interactive RLHF slider changes in SIMULATIONS tab
  const handleRLHFWeightsChange = (weights: { riskAversion: number; marginDefense: number; differentiation: number }) => {
    setActiveSimulationScenarios((prev) => {
      if (!prev || prev.length === 0) return prev;
      return prev.map((sc) => {
        let newScore = sc.score;
        if (sc.scenario.includes("DIFFERENTIATE") || sc.scenario.includes("ASYMMETRIC")) {
          newScore = Math.min(99, Math.max(70, Math.round(75 + (weights.differentiation * 0.25))));
        } else if (sc.scenario.includes("MATCH") || sc.scenario.includes("DIRECT")) {
          newScore = Math.min(85, Math.max(30, Math.round(50 + ((100 - weights.marginDefense) * 0.25) - (weights.riskAversion * 0.1))));
        } else {
          newScore = Math.min(60, Math.max(15, Math.round(30 + ((100 - weights.riskAversion) * 0.2))));
        }
        return { ...sc, score: newScore };
      }).sort((a, b) => b.score - a.score).map((sc, i) => ({ ...sc, recommended: i === 0 }));
    });
  };

  // Execute Chosen Strategy via Hands / Wire
  const handleExecuteScenario = async (sc: Scenario) => {
    try {
      const action = await api.executeAction({
        action_id: "github.issue.create",
        payload: {
          repo: "anthropic/enterprise-intelligence",
          title: `COUNTER-STRATEGY: ${sc.scenario}`,
          body: `## Execution Order\nDispatched from WEBODY Hands autonomous executor.\nReasoning: ${sc.reasoning}`,
          labels: ["priority-p0", "anakin-wire", "autonomous-action"]
        },
        auto_approved: true
      });
      setActiveExecutedAction(action);
    } catch (err) {
      console.error("Error executing Wire action:", err);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const data = await api.testAnakinConnection();
      setConnectionInfo(data);
    } catch (e) {}
  };

  const handlePlayBriefing = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/webody_narration.wav");
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => {
          // Fallback to Web Speech API
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            const text = demoTakeaway || "WEBODY Living Operating System online. Monitoring competitive landscape.";
            const u = new SpeechSynthesisUtterance(text);
            u.onend = () => setIsPlayingAudio(false);
            window.speechSynthesis.speak(u);
            setIsPlayingAudio(true);
          }
        };
      }
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const text = demoTakeaway || "WEBODY Living Operating System online. Monitoring competitive landscape.";
          const u = new SpeechSynthesisUtterance(text);
          u.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(u);
          setIsPlayingAudio(true);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportDossier = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `WEBODY-Intelligence-Dossier-${timestamp}.md`;
    const doc = `# WEBODY LIVING OPERATING SYSTEM — EXECUTIVE INTELLIGENCE DOSSIER
Generated: ${new Date().toUTCString()}
Classification: CONFIDENTIAL / STRATEGIC ADVISORY
Team: kailashsharma | Hackathon: Anakin Forge

---

## 1. EXECUTIVE SITUATION REPORT
${demoTakeaway || "Autonomous market intelligence loop active. Structural shifts tracked across monitored competitive landscape."}

## 2. ACTIVE SIGNALS & SURVEILLANCE (${signals.length})
${signals.map(s => `- **[${s.severity.toUpperCase()}] ${s.title}** (${s.event_type || "Market Event"})\n  ${s.summary}\n  Confidence: ${Math.round(s.confidence * 100)}%`).join("\n\n")}

## 3. PREDICTIVE TRAJECTORIES (${predictions.length})
${predictions.map(p => `- **Time Window: ${p.time_window || "24-48h"}** | Probability: ${Math.round(p.probability * 100)}%\n  Prediction: ${p.prediction}\n  Reasoning: ${p.reasoning}`).join("\n\n")}

## 4. STRATEGIC SCENARIOS & GAME THEORY
${activeSimulationScenarios.map(sc => `### ${sc.scenario} (Score: ${sc.score}/100)
- **Net Benefit:** +${sc.benefit}%
- **Downside Risk:** ${sc.risk}%
- **Operational Complexity:** ${sc.complexity}%
- **Strategic Rationale:** ${sc.reasoning}`).join("\n\n")}


## 5. EXECUTED COUNTER-ACTIONS (ANAKIN WIRE)
${activeExecutedAction ? `- Action ID: ${activeExecutedAction.action_id}\n- Status: ${activeExecutedAction.status}\n- Payload: ${JSON.stringify(activeExecutedAction.payload, null, 2)}` : "No actions executed yet."}

---
*Generated by WEBODY — The Living Operating System for the Internet*
`;

    const blob = new Blob([doc], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const navItems = [
    { id: "WORLD", label: "WORLD", icon: Globe },
    { id: "WATCHLIST", label: "WATCHLIST", icon: Eye },
    { id: "MAP", label: "MAP", icon: FolderTree },
    { id: "SIGNALS", label: "SIGNALS", icon: Radio },
    { id: "PREDICTIONS", label: "PREDICTIONS", icon: TrendingUp },
    { id: "SIMULATIONS", label: "SIMULATIONS", icon: SlidersHorizontal },
    { id: "WAR_ROOM", label: "WAR ROOM", icon: Swords },
    { id: "ACTIONS", label: "ACTIONS (WIRE)", icon: Zap },
    { id: "TIMELINE", label: "TIMELINE", icon: Clock },
    { id: "AI REPUTATION", label: "AI REPUTATION", icon: Sparkles },
    { id: "NEXT_GEN", label: "COGNITION & RADAR", icon: Brain },
    { id: "INSPECTOR", label: "ANAKIN INSPECTOR", icon: Terminal },
    { id: "SETTINGS", label: "SETTINGS", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-surface-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-hud-cyan/50 flex items-center justify-center neon-glow-cyan shadow-sm shadow-hud-cyan/30">
              <span className="text-hud-cyan font-mono font-black text-lg tracking-tighter">W</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base tracking-widest text-slate-100">
                  WEBODY
                </span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40">
                  OS v2.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-mono text-slate-400">
                The Living Operating System for the Internet
              </p>
            </div>
          </div>

          {/* Autonomous Loop Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
            <span className="text-hud-cyan font-semibold">OBSERVE</span>
            <span>→</span>
            <span className="text-hud-violet font-semibold">UNDERSTAND</span>
            <span>→</span>
            <span className="text-hud-amber font-semibold">PREDICT</span>
            <span>→</span>
            <span className="text-hud-emerald font-semibold">SIMULATE</span>
            <span>→</span>
            <span className="text-hud-rose font-semibold">ACT</span>
            <span>→</span>
            <span className="text-slate-300 font-semibold">LEARN</span>
          </div>

          {/* Right Controls: Exactly 3 items, perfectly spaced, zero overflow */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Connection Status Pill */}
            <button
              onClick={() => setActiveTab("INSPECTOR")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:border-slate-700 transition-colors shrink-0"
              title="Click to open Live Anakin Inspector"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isWsConnected ? "bg-hud-emerald animate-pulse" : "bg-hud-amber"
                }`}
              />
              <span className="hidden sm:inline font-bold">
                {isWsConnected ? "LIVE TELEMETRY (8008)" : "CONNECTING (8008)..."}
              </span>
              <span className="sm:hidden font-bold">
                {isWsConnected ? "SYNC" : "8008"}
              </span>
            </button>

            {/* Audio Intelligence Briefing with Waveform */}
            <button
              onClick={handlePlayBriefing}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                isPlayingAudio
                  ? "bg-hud-rose/20 text-hud-rose border-hud-rose animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-hud-cyan hover:border-hud-cyan/50"
              }`}
              title={isPlayingAudio ? "Stop Audio Briefing" : "Listen to Executive Voice Briefing"}
            >
              {isPlayingAudio ? (
                <div className="flex items-center gap-0.5 h-3.5 px-0.5">
                  <span className="w-0.5 bg-hud-rose wave-bar-1 rounded-full" />
                  <span className="w-0.5 bg-hud-rose wave-bar-2 rounded-full" />
                  <span className="w-0.5 bg-hud-rose wave-bar-3 rounded-full" />
                  <span className="w-0.5 bg-hud-rose wave-bar-4 rounded-full" />
                </div>
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline font-bold">{isPlayingAudio ? "PLAYING" : "BRIEFING"}</span>
            </button>

            {/* Deterministic Demo Button (RUN THE FUTURE) - Prominent, Uncrushable, Glowing */}
            <button
              onClick={handleRunTheFuture}
              disabled={isDemoRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-hud-cyan via-teal-400 to-hud-cyan text-slate-950 font-mono font-black text-xs tracking-wider shadow-lg shadow-hud-cyan/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isDemoRunning ? "animate-spin" : ""}`} />
              <span>{isDemoRunning ? "SIMULATING..." : "RUN THE FUTURE"}</span>
            </button>
          </div>
        </div>


        {/* Navigation Tabs (Section 10) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/60 py-1.5 text-xs font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md uppercase whitespace-nowrap text-[11px] transition-all duration-200 ${
                  isActive
                    ? "bg-hud-cyan text-slate-950 font-bold shadow-sm shadow-hud-cyan/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Cyber Intelligence Live Ticker Tape */}
      <IntelligenceTicker signals={signals} onOpenDiff={() => setIsDiffModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Section 10 Landing Dashboard Headline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-100 uppercase">
              THE WORLD MOVED.
            </h1>
            <p className="text-base sm:text-lg font-mono text-hud-cyan font-medium mt-0.5">
              WEBODY is watching.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>TEAM: <strong className="text-slate-200">kailashsharma</strong></span>
            <span>•</span>
            <span>PARTICIPANT: <strong className="text-slate-200">Pochiraju Kailash</strong></span>
          </div>
        </div>

        {/* Top 6 System Metrics (Section 10) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SystemMetric
            label="Entities Tracked"
            value={graphData.nodes.length || 6}
            change="+2 new"
            trend="up"
            icon={Globe}
            color="cyan"
          />
          <SystemMetric
            label="Relationships"
            value={graphData.edges.length || 7}
            change="evolved"
            trend="up"
            icon={Layers}
            color="violet"
          />
          <SystemMetric
            label="Active Signals"
            value={signals.length || 4}
            change="1 critical"
            trend="down"
            icon={Radio}
            color="rose"
          />
          <SystemMetric
            label="Predictions"
            value={predictions.length || 3}
            change="84% avg"
            trend="up"
            icon={TrendingUp}
            color="amber"
          />
          <SystemMetric
            label="Opportunities"
            value="3 Paths"
            change="Score 94"
            trend="up"
            icon={SlidersHorizontal}
            color="emerald"
          />
          <SystemMetric
            label="Actions"
            value={activeExecutedAction ? "1 Deployed" : "Ready"}
            change="Wire OK"
            trend="up"
            icon={Zap}
            color="cyan"
          />
        </div>

        {/* Section 20 Agent Trail (Expandable) */}
        {agentTrail.length > 0 && (
          <AgentTrail trail={agentTrail} isExpandedDefault={true} />
        )}

        {/* Final Takeaway Banner if Demo completed */}
        {demoTakeaway && (
          <div className="p-4 rounded-xl glass-panel border border-hud-cyan/50 bg-gradient-to-r from-hud-cyan/10 via-surface to-hud-violet/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-hud-cyan/20 text-hud-cyan">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-hud-cyan tracking-wider">
                  MISSION COMPLETE • AUTONOMOUS LOOP CLOSED
                </span>
                <p className="text-sm font-sans font-medium text-slate-100 italic mt-0.5">
                  "{demoTakeaway}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("ACTIONS")}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:text-hud-cyan hover:border-hud-cyan transition-all whitespace-nowrap"
            >
              VIEW WIRE LOG →
            </button>
          </div>
        )}

        {/* Strategic Command Deck: Benchmark Selector, Sentinel Diff, Audit Proof & Dossier */}
        <div className="p-3.5 rounded-xl glass-panel border border-slate-800/90 bg-slate-950/80 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-hud-amber/10 border border-hud-amber/30 text-[11px] font-bold text-hud-amber">
              <Swords className="w-3.5 h-3.5" />
              <span>BENCHMARK RIVALRY:</span>
            </div>
            <select
              value={selectedRivalry}
              onChange={(e) => {
                setSelectedRivalry(e.target.value);
                handleRunTheFuture();
              }}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-hud-cyan font-bold outline-none cursor-pointer hover:border-hud-cyan transition-colors"
              title="Select Competitive Benchmark Rivalry"
            >
              <option value="frontier_ai" className="bg-slate-900 text-slate-200">Anthropic vs. OpenAI (Frontier Reasoning & Price War)</option>
              <option value="cloud_agents" className="bg-slate-900 text-slate-200">DeepMind vs. OpenAI (Multimodal Reasoning Race)</option>
              <option value="crm_agents" className="bg-slate-900 text-slate-200">Salesforce vs. HubSpot (Enterprise Agent Platform)</option>
              <option value="defense_data" className="bg-slate-900 text-slate-200">Palantir vs. Snowflake (Sovereign Data & Governance)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDiffModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-hud-rose/40 text-xs text-hud-rose hover:bg-hud-rose/10 hover:border-hud-rose transition-all font-bold cursor-pointer"
              title="Open Sentinel Side-by-Side Change Diff"
            >
              <Split className="w-3.5 h-3.5" />
              <span>SENTINEL DIFF</span>
            </button>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-hud-emerald/40 text-xs text-hud-emerald hover:bg-hud-emerald/10 hover:border-hud-emerald transition-all font-bold cursor-pointer"
              title="Inspect Verifiable SHA-256 Cryptographic Provenance Chain"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AUDIT PROOF</span>
            </button>

            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-all font-bold cursor-pointer"
              title="Download Executive Intelligence Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>EXPORT DOSSIER</span>
            </button>
          </div>
        </div>

        {/* TAB 1: WORLD */}
        {activeTab === "WORLD" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* World Graph (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <WorldGraphComponent
                nodes={graphData.nodes}
                edges={graphData.edges}
                onSelectNode={(node) => setSelectedEntity(node)}
                selectedNodeId={selectedEntity?.id}
                isDemoActive={isDemoRunning || !!demoTakeaway}
              />
            </div>

            {/* Live Signals Sidebar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Radio className="w-3.5 h-3.5 text-hud-rose animate-pulse" />
                  REAL-TIME SENTINEL SIGNALS
                </div>
                <button
                  onClick={async () => {
                    const s = await api.injectDemoSignal();
                    setSignals((prev) => [s, ...prev]);
                  }}
                  className="text-[11px] font-mono text-hud-cyan hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Demo Signal
                </button>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {signals.slice(0, 4).map((sig) => (
                  <SignalCard
                    key={sig.id}
                    signal={sig}
                    onWhyCare={handleWhyShouldICare}
                    onWhatNext={handleWhatHappensNext}
                    onWhatDo={handleWhatCanWeDo}
                    onViewDiff={() => setIsDiffModalOpen(true)}
                    isInvestigating={investigatingSignalId === sig.id}
                    isPredicting={predictingSignalId === sig.id}
                    isSimulating={simulatingSignalId === sig.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WATCHLIST */}
        {activeTab === "WATCHLIST" && (
          <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-hud-cyan uppercase font-bold">
                  SENTINEL ENGINE
                </span>
                <h2 className="text-xl font-bold font-mono text-slate-100">
                  Monitored Watch Targets
                </h2>
              </div>
              <button
                onClick={async () => {
                  const nt = await api.createWatchTarget({
                    name: "OpenAI Platform & Model Releases",
                    entity_type: "pricing_page",
                    url: "https://openai.com/api/pricing",
                    category: "PRICING",
                    importance: 95,
                    monitoring_frequency: "hourly",
                    enabled: true,
                  });
                  setWatchTargets((prev) => [nt, ...prev]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hud-cyan text-slate-950 font-mono text-xs font-bold hover:bg-hud-cyan/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> ADD TARGET
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchTargets.map((wt) => (
                <div key={wt.id} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-hud-cyan border border-slate-800 text-[10px]">
                      {wt.category}
                    </span>
                    <span className="text-slate-400">FREQ: {wt.monitoring_frequency}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{wt.name}</h4>
                  <a
                    href={wt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-hud-cyan flex items-center gap-1 truncate"
                  >
                    {wt.url} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <div className="pt-2 border-t border-slate-900 flex justify-between text-slate-500 text-[10px]">
                    <span>IMPORTANCE: {wt.importance}%</span>
                    <span className="text-hud-emerald">SYNCED TO MONITOR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MAP (Cartographer) */}
        {activeTab === "MAP" && (
          <DependencyMap
            onMapDomain={async (domain) => {
              await api.mapDomain(domain);
              fetchAllData();
            }}
          />
        )}

        {/* TAB 4: SIGNALS */}
        {activeTab === "SIGNALS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-hud-cyan uppercase font-bold">
                  SENTINEL OBSERVATION FEED
                </span>
                <h2 className="text-xl font-bold font-mono text-slate-100">
                  External Signals & Change Events
                </h2>
              </div>
              <button
                onClick={async () => {
                  const s = await api.injectDemoSignal();
                  setSignals((prev) => [s, ...prev]);
                }}
                className="px-3 py-1.5 rounded-lg bg-hud-rose/20 border border-hud-rose/40 text-hud-rose font-mono text-xs font-bold hover:bg-hud-rose/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> INJECT DEMO SIGNAL
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((sig) => (
                <SignalCard
                  key={sig.id}
                  signal={sig}
                  onWhyCare={handleWhyShouldICare}
                  onWhatNext={handleWhatHappensNext}
                  onWhatDo={handleWhatCanWeDo}
                  onViewDiff={() => setIsDiffModalOpen(true)}
                  isInvestigating={investigatingSignalId === sig.id}
                  isPredicting={predictingSignalId === sig.id}
                  isSimulating={simulatingSignalId === sig.id}
                />

              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PREDICTIONS (Oracle) */}
        {activeTab === "PREDICTIONS" && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-hud-violet uppercase font-bold">
                ORACLE FORECASTING ENGINE
              </span>
              <h2 className="text-xl font-bold font-mono text-slate-100">
                Predictive Intelligence & Probability Bounds
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((pred) => (
                <PredictionCard
                  key={pred.id}
                  prediction={pred}
                  onSimulate={(p) => {
                    const matchedSignal = signals.find((s) => s.id === p.signal_id);
                    handleWhatCanWeDo(
                      matchedSignal || {
                        id: p.signal_id || "sig-live",
                        entity: "OpenAI",
                        source: "Oracle Bayesian Engine",
                        url: "https://openai.com/api/pricing",
                        timestamp: new Date().toISOString(),
                        event_type: "strategic_prediction",
                        title: p.prediction,
                        summary: p.reasoning,
                        importance: 92,
                        severity: "high",
                        confidence: p.confidence,
                        actionability: "high",
                        is_demo: false,
                        created_at: new Date().toISOString()
                      }
                    );
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SIMULATIONS (Simulator) */}
        {activeTab === "SIMULATIONS" && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-hud-emerald uppercase font-bold">
                SIMULATOR ENGINE
              </span>
              <h2 className="text-xl font-bold font-mono text-slate-100">
                Strategic Scenario Comparison & Risk Scoring
              </h2>
            </div>

            {/* Interactive RLHF Sliders */}
            <ScenarioSimulatorControls onWeightsChange={handleRLHFWeightsChange} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeSimulationScenarios.length > 0 ? (
                activeSimulationScenarios.map((sc) => (
                  <ScenarioCard
                    key={sc.id}
                    scenario={sc}
                    onSelect={() => {}}
                    onExecute={handleExecuteScenario}
                  />
                ))
              ) : (
                <div className="col-span-3 glass-panel p-8 rounded-xl text-center text-slate-400 font-mono text-xs">
                  NO ACTIVE SIMULATION GENERATED YET. CLICK "WHAT CAN WE DO?" ON ANY SIGNAL OR CLICK "RUN THE FUTURE".
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: WAR ROOM (Game-Theoretic Equilibrium) */}
        {activeTab === "WAR_ROOM" && (
          <WarRoomSimulator />
        )}

        {/* TAB 7: ACTIONS (Hands / Wire) */}
        {activeTab === "ACTIONS" && (
          <div className="space-y-6">
            <WireActionDispatcher />

            {activeExecutedAction && (
              <div className="glass-panel p-5 rounded-xl border border-surface-border space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-hud-emerald font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-hud-emerald" />
                    MOST RECENT EXECUTED ACTION
                  </span>
                  <span className="px-2 py-0.5 rounded bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40 uppercase">
                    {activeExecutedAction.status}
                  </span>
                </div>
                <div className="text-slate-400">
                  ACTION: <span className="text-slate-200 font-bold">{activeExecutedAction.name} ({activeExecutedAction.action_id})</span>
                </div>
                {activeExecutedAction.external_id && (
                  <div className="text-slate-400">
                    WIRE REF: <span className="text-hud-cyan font-bold">{activeExecutedAction.external_id}</span>
                  </div>
                )}
                <div className="p-3 bg-slate-900 rounded border border-slate-800 whitespace-pre-wrap text-slate-300 max-h-40 overflow-y-auto">
                  {JSON.stringify(activeExecutedAction.payload, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: TIMELINE */}
        {activeTab === "TIMELINE" && (
          <Timeline events={timelineEvents} entityName={selectedEntity?.name || "OpenAI"} />
        )}

        {/* TAB 9: AI REPUTATION */}
        {activeTab === "AI REPUTATION" && (
          <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <span className="text-xs font-mono text-hud-violet uppercase font-bold">
                AI VISIBILITY MODULE (ANAKIN AI VISIBILITY)
              </span>
              <h2 className="text-xl font-bold font-mono text-slate-100">
                LLM Surface Brand Mentions & Association Patterns
              </h2>
            </div>

            {aiReputation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 uppercase">BRAND MENTIONS</span>
                  <div className="text-2xl font-bold text-hud-cyan mt-1">
                    {aiReputation.brand_mentions}
                  </div>
                  <span className="text-hud-emerald text-[10px]">+18% across OpenAI & Anthropic</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 uppercase">COMPETITOR MENTIONS</span>
                  <div className="text-2xl font-bold text-hud-rose mt-1">
                    {aiReputation.competitor_mentions}
                  </div>
                  <span className="text-slate-500 text-[10px]">Frontier Rival Activity</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 uppercase">RECOMMENDATION PATTERNS</span>
                  <div className="mt-2 space-y-1">
                    {aiReputation.recommendation_patterns.map((p, i) => (
                      <div key={i} className="text-[11px] text-slate-300">• {p}</div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 uppercase">EMERGING ASSOCIATIONS</span>
                  <div className="mt-2 space-y-1">
                    {aiReputation.emerging_associations.map((a, i) => (
                      <div key={i} className="text-[11px] text-hud-amber">• {a}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-6 text-center">
                AI REPUTATION OBSERVATION SYNCING...
              </div>
            )}
          </div>
        )}

        {/* TAB: NEXT-GEN COGNITION & RADAR */}
        {activeTab === "NEXT_GEN" && (
          <NextGenHub />
        )}

        {/* TAB: ANAKIN LIVE INSPECTOR */}
        {activeTab === "INSPECTOR" && (
          <AnakinInspector />
        )}

        {/* TAB 10: SETTINGS (Section 27) */}

        {activeTab === "SETTINGS" && (
          <div className="glass-panel p-6 rounded-xl border border-surface-border max-w-2xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <span className="text-xs font-mono text-hud-cyan uppercase font-bold">
                AUTONOMOUS SAFETY GATES (SECTION 27)
              </span>
              <h2 className="text-xl font-bold font-mono text-slate-100">
                System Governance & Controls
              </h2>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="font-bold text-slate-200">AUTO ACTION GATE</div>
                  <div className="text-slate-400 text-[11px]">
                    Requires explicit manual user approval for all external Wire dispatches.
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const nextVal = !settings.AUTO_ACTION;
                    await api.updateSettings({ AUTO_ACTION: nextVal });
                    setSettings((s) => ({ ...s, AUTO_ACTION: nextVal }));
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-colors ${
                    settings.AUTO_ACTION
                      ? "bg-hud-emerald text-slate-950"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {settings.AUTO_ACTION ? "ENABLED" : "DISABLED (OFF)"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="font-bold text-slate-200">DEMO AUTO ACTION GATE</div>
                  <div className="text-slate-400 text-[11px]">
                    Allows deterministic demo sequence to auto-execute approved safe actions.
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const nextVal = !settings.DEMO_AUTO_ACTION;
                    await api.updateSettings({ DEMO_AUTO_ACTION: nextVal });
                    setSettings((s) => ({ ...s, DEMO_AUTO_ACTION: nextVal }));
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-colors ${
                    settings.DEMO_AUTO_ACTION
                      ? "bg-hud-cyan text-slate-950"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {settings.DEMO_AUTO_ACTION ? "ENABLED (ON)" : "DISABLED"}
                </button>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 space-y-1">
                <div className="text-slate-300 font-bold">SECURITY & SECRETS ISOLATION</div>
                <div>ANAKIN_API_KEY: Configured on server ({settings.ANAKIN_API_KEY_CONFIGURED ? "YES" : "NO"})</div>
                <div>CLIENT EXPOSURE: NONE (Never exposed to browser)</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-out Entity Profile Drawer (Section 15) */}
      <EntityCard
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Cortex Evidence Panel Modal (Section 17) */}
      <EvidencePanel
        investigation={activeInvestigation}
        onClose={() => setActiveInvestigation(null)}
        onProceedToOracle={() => {
          setActiveInvestigation(null);
          setActiveTab("PREDICTIONS");
        }}
      />

      {/* Anakin Wire Action Execution Modal (Section 10) */}
      <ActionExecution
        action={activeExecutedAction}
        onClose={() => setActiveExecutedAction(null)}
      />

      {/* Sentinel Side-by-Side Diff Modal (Feature 4) */}
      <SentinelDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onSimulate={() => {
          setIsDiffModalOpen(false);
          setActiveTab("SIMULATIONS");
        }}
      />

      {/* Cryptographic Forensic Provenance Modal */}
      <CryptographicAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />


      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 px-4 sm:px-8 text-center text-xs font-mono text-slate-500">
        <p>
          WEBODY Living Operating System • Hackathon: Anakin Forge • Participant: Pochiraju Kailash Ram Markandeya Sharma • Team: kailashsharma
        </p>
      </footer>
    </div>
  );
}
