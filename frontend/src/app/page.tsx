"use client";

import React, { useState, useEffect } from "react";
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


export default function Dashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("WORLD");

  // World Graph & Telemetry
  const [graphData, setGraphData] = useState<WorldGraph>({
    nodes: [],
    edges: [],
    updated_at: new Date().toISOString(),
  });
  const [signals, setSignals] = useState<Signal[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [watchTargets, setWatchTargets] = useState<WatchTarget[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [aiReputation, setAiReputation] = useState<AIVisibility | null>(null);
  const [settings, setSettings] = useState<Settings>({
    AUTO_ACTION: false,
    DEMO_AUTO_ACTION: true,
    ANAKIN_API_KEY_CONFIGURED: false,
    ACTIVE_MODE: "DEMO_RELIABILITY",
  });

  // Modal / Drawer States
  const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);
  const [activeInvestigation, setActiveInvestigation] = useState<Investigation | null>(null);
  const [activeSimulationScenarios, setActiveSimulationScenarios] = useState<Scenario[]>([]);
  const [activeExecutedAction, setActiveExecutedAction] = useState<Action | null>(null);
  const [agentTrail, setAgentTrail] = useState<AgentTrailStep[]>([]);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);

  
  // Loading & Execution States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoTakeaway, setDemoTakeaway] = useState<string | null>(null);
  const [investigatingSignalId, setInvestigatingSignalId] = useState<string | null>(null);
  const [predictingSignalId, setPredictingSignalId] = useState<string | null>(null);
  const [simulatingSignalId, setSimulatingSignalId] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);



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
          DEMO_AUTO_ACTION: true,
          ANAKIN_API_KEY_CONFIGURED: false,
          ACTIVE_MODE: "DEMO_RELIABILITY",
        })),
      ]);

      setGraphData(graph);
      setSignals(sigs);
      setPredictions(preds);
      setWatchTargets(targets);
      setSettings(sett);

      // Fetch Competitor X timeline and AI reputation if exists
      const compX = graph.nodes.find((n) => (n.name || n.label || "").toLowerCase().includes("competitor"));
      if (compX) {
        const [tl, ai] = await Promise.all([
          api.getTimeline(compX.id).catch(() => []),
          api.getAIReputation(compX.id).catch(() => null),
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

    // Establish WebSocket real-time telemetry stream
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8008/api/ws/telemetry";
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "governor.updated" || packet.type === "demo.completed") {
            fetchAllData();
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Section 21 & 36: One-Click Deterministic Demo ("RUN THE FUTURE")
  const handleRunTheFuture = async () => {
    setIsDemoRunning(true);
    setDemoTakeaway(null);
    try {
      const demoRes: DemoRunResponse = await api.runDeterministicDemo();

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

  // Execute Chosen Strategy via Hands / Wire
  const handleExecuteScenario = async (sc: Scenario) => {
    try {
      const action = await api.executeAction({
        action_id: "github.issue.create",
        payload: {
          repo: "acme-ai/enterprise-platform",
          title: `COUNTER-STRATEGY: ${sc.scenario}`,
          body: `## Execution Order\nDispatched from WEBODY Hands.\nReasoning: ${sc.reasoning}`,
          labels: ["priority-p0", "anakin-wire", "hackathon-demo"]
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
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const text = demoTakeaway
      ? `Attention executive leadership. Autonomous intelligence cycle complete. ${demoTakeaway}. All counter-measures staged and validated.`
      : `WEBODY Living Operating System online. Monitoring competitive landscape. High volatility detected for Competitor X with 22 percent price reduction. Counter-strategy Differentiate recommended with plus 90 net benefit score.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
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
    { id: "ACTIONS", label: "ACTIONS", icon: Zap },
    { id: "TIMELINE", label: "TIMELINE", icon: Clock },
    { id: "AI REPUTATION", label: "AI REPUTATION", icon: Sparkles },
    { id: "NEXT_GEN", label: "COGNITION & RADAR", icon: Brain },
    { id: "INSPECTOR", label: "ANAKIN INSPECTOR", icon: Terminal },
    { id: "SETTINGS", label: "SETTINGS", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-surface-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-hud-cyan/50 flex items-center justify-center neon-glow-cyan">
              <span className="text-hud-cyan font-mono font-black text-lg tracking-tighter">W</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base tracking-widest text-slate-100">
                  WEBODY
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40">
                  OS v1.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-mono text-slate-400">
                The Living Operating System for the Internet
              </p>
            </div>
          </div>

          {/* Autonomous Loop Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="text-hud-cyan">OBSERVE</span>
            <span>→</span>
            <span className="text-hud-violet">UNDERSTAND</span>
            <span>→</span>
            <span className="text-hud-amber">PREDICT</span>
            <span>→</span>
            <span className="text-hud-emerald">SIMULATE</span>
            <span>→</span>
            <span className="text-hud-rose">ACT</span>
            <span>→</span>
            <span className="text-slate-300">LEARN</span>
          </div>

          {/* Right Controls: Mode, Briefing, Dossier & RUN THE FUTURE */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Connection Status Pill */}
            <button
              onClick={() => setActiveTab("INSPECTOR")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:border-slate-700 transition-colors"
              title="Click to open Live Anakin Inspector"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionInfo?.authenticated ? "bg-hud-emerald animate-pulse" : "bg-hud-amber"
                }`}
              />
              <span className="hidden sm:inline">
                {connectionInfo?.authenticated ? `ANAKIN LIVE (${connectionInfo.latency_ms || 120}ms)` : "DEMO RELIABLE"}
              </span>
              <span className="sm:hidden">
                {connectionInfo?.authenticated ? "LIVE" : "DEMO"}
              </span>
            </button>

            {/* Audio Intelligence Briefing */}
            <button
              onClick={handlePlayBriefing}
              className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                isPlayingAudio
                  ? "bg-hud-rose/20 text-hud-rose border-hud-rose animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-hud-cyan hover:border-hud-cyan/50"
              }`}
              title={isPlayingAudio ? "Stop Audio Briefing" : "Listen to Executive Voice Briefing"}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isPlayingAudio ? "STOP AUDIO" : "BRIEFING"}</span>
            </button>

            {/* Export Strategic Dossier */}
            <button
              onClick={handleExportDossier}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-all"
              title="Download Executive Intelligence Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>DOSSIER</span>
            </button>

            {/* Visual Sentinel Diff Inspector */}
            <button
              onClick={() => setIsDiffModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-hud-rose hover:border-hud-rose/50 transition-all"
              title="Open Sentinel Side-by-Side Change Diff"
            >
              <Split className="w-3.5 h-3.5 text-hud-rose" />
              <span>SENTINEL DIFF</span>
            </button>

            {/* Deterministic Demo Button (Sections 21 & 36) */}
            <button
              onClick={handleRunTheFuture}
              disabled={isDemoRunning}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-hud-cyan via-teal-400 to-hud-cyan text-slate-950 font-mono font-bold text-xs tracking-wider shadow-lg shadow-hud-cyan/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isDemoRunning ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isDemoRunning ? "SIMULATING..." : "RUN THE FUTURE"}</span>
              <span className="sm:hidden">{isDemoRunning ? "..." : "RUN"}</span>
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
      <IntelligenceTicker onOpenDiff={() => setIsDiffModalOpen(true)} />

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

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {signals.slice(0, 3).map((sig) => (
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
                    name: "Competitor X Enterprise Pricing",
                    entity_type: "pricing_page",
                    url: "https://competitorx.ai/pricing",
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
                    handleWhatCanWeDo({
                      id: p.signal_id || "sig-demo",
                      entity: "Competitor X",
                      source: "Oracle Forecast",
                      url: "https://competitorx.ai",
                      timestamp: new Date().toISOString(),
                      event_type: "strategic_prediction",
                      title: p.prediction,
                      summary: p.reasoning,
                      importance: 90,
                      severity: "high",
                      confidence: p.confidence,
                      actionability: "high",
                      is_demo: true,
                      created_at: new Date().toISOString()
                    });
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

        {/* TAB 7: ACTIONS (Hands / Wire) */}
        {activeTab === "ACTIONS" && (
          <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-hud-rose uppercase font-bold">
                  HANDS ACTION ENGINE (ANAKIN WIRE)
                </span>
                <h2 className="text-xl font-bold font-mono text-slate-100">
                  External Workflow Execution & Audit Logs
                </h2>
              </div>
              <button
                onClick={async () => {
                  const cat = await api.discoverActions();
                  alert(`Discovered ${cat.count} Wire actions: ${cat.actions.map((a: any) => a.action_id).join(", ")}`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-hud-cyan transition-all"
              >
                DISCOVER WIRE CATALOG
              </button>
            </div>

            {activeExecutedAction ? (
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-hud-emerald font-bold text-sm">
                    {activeExecutedAction.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40 uppercase">
                    {activeExecutedAction.status}
                  </span>
                </div>
                <div className="text-slate-400">
                  ACTION ID: <span className="text-slate-200">{activeExecutedAction.action_id}</span>
                </div>
                {activeExecutedAction.external_id && (
                  <div className="text-slate-400">
                    WIRE EXTERNAL REF: <span className="text-slate-200">{activeExecutedAction.external_id}</span>
                  </div>
                )}
                <div className="p-3 bg-slate-900 rounded border border-slate-800 whitespace-pre-wrap text-slate-300">
                  {JSON.stringify(activeExecutedAction.payload, null, 2)}
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-8 text-center">
                NO ACTIONS EXECUTED YET IN CURRENT SESSION.
              </div>
            )}
          </div>
        )}

        {/* TAB 8: TIMELINE */}
        {activeTab === "TIMELINE" && (
          <Timeline events={timelineEvents} entityName="Competitor X" />
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
                  <span className="text-slate-500 text-[10px]">Competitor X Surge</span>
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


      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 px-4 sm:px-8 text-center text-xs font-mono text-slate-500">
        <p>
          WEBODY Living Operating System • Hackathon: Anakin Forge • Participant: Pochiraju Kailash Ram Markandeya Sharma • Team: kailashsharma
        </p>
      </footer>
    </div>
  );
}
