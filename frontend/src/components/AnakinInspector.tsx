"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, Terminal, ShieldCheck, Zap, Globe, 
  Search, RefreshCw, CheckCircle2, AlertCircle, 
  Layers, ExternalLink, Code2, Play
} from "lucide-react";
import { api } from "../lib/api";

export function AnakinInspector() {
  const [activeAction, setActiveAction] = useState<"map" | "scrape" | "search" | "wire">("scrape");
  const [target, setTarget] = useState("https://openai.com");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isCheckingConn, setIsCheckingConn] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  // Presets
  const presets: Record<string, string[]> = {
    scrape: ["https://openai.com", "https://stripe.com", "https://news.ycombinator.com"],
    map: ["openai.com", "stripe.com", "anthropic.com"],
    search: [
      "Enterprise AI price war trends 2026",
      "Competitor X enterprise pricing reduction analysis",
      "Cloud hyperscaler GPU cost changes"
    ],
    wire: ["github", "slack", "webhook", "all"]
  };

  const checkConnection = async () => {
    setIsCheckingConn(true);
    try {
      const data = await api.testAnakinConnection();
      setConnectionStatus(data);
    } catch (err: any) {
      setConnectionStatus({
        status: "error",
        authenticated: false,
        message: err?.message || "Failed to reach backend connection test."
      });
    } finally {
      setIsCheckingConn(false);
    }
  };

  const handleReloadKey = async () => {
    setIsReloading(true);
    try {
      const res = await api.reloadAnakinKey();
      setConnectionStatus(res.verification);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsReloading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleRunInspect = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.liveInspectAnakin(activeAction, target);
      setResult(res);
    } catch (err: any) {
      setResult({
        status: "error",
        action: activeAction,
        target,
        error: err?.message || "Execution failed",
        duration_ms: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Credentials & Diagnostics Status Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-700">
            <ShieldCheck className={`w-5 h-5 ${connectionStatus?.authenticated ? "text-hud-emerald" : "text-hud-amber"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold tracking-wider text-slate-100">
                ANAKIN REST API SUITE — LIVE INSPECTOR
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                connectionStatus?.authenticated 
                  ? "bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40"
                  : "bg-hud-amber/20 text-hud-amber border border-hud-amber/40"
              }`}>
                {connectionStatus?.authenticated ? "LIVE AUTHENTICATED" : "DEMO RELIABILITY ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {connectionStatus?.message || "Checking Anakin.io gateway status..."}
              {connectionStatus?.latency_ms ? ` (Latency: ${connectionStatus.latency_ms}ms)` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={checkConnection}
            disabled={isCheckingConn}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
          >
            <Activity className={`w-3.5 h-3.5 ${isCheckingConn ? "animate-spin" : ""}`} />
            {isCheckingConn ? "Testing..." : "Test Ping"}
          </button>
          <button
            onClick={handleReloadKey}
            disabled={isReloading}
            className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg bg-hud-cyan/10 hover:bg-hud-cyan/20 text-hud-cyan text-xs font-mono font-semibold border border-hud-cyan/30 flex items-center justify-center gap-1.5 transition-all"
            title="Reloads ANAKIN_API_KEY from .env without restarting server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? "animate-spin" : ""}`} />
            {isReloading ? "Reloading..." : "Reload .env Key"}
          </button>
        </div>
      </div>

      {/* Main Interactive Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Official Anakin Capability
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "scrape", label: "SCRAPER", icon: Code2, desc: "Markdown & Structured DOM" },
                  { id: "map", label: "MAP", icon: Globe, desc: "Sitemap & Graph Topology" },
                  { id: "search", label: "AGENTIC SEARCH", icon: Search, desc: "Deep multi-step reasoning" },
                  { id: "wire", label: "WIRE ACTIONS", icon: Zap, desc: "Dynamic execution catalog" }
                ].map((act) => {
                  const Icon = act.icon;
                  const isSel = activeAction === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        setActiveAction(act.id as any);
                        setTarget(presets[act.id][0] || "");
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSel
                          ? "bg-hud-cyan/15 border-hud-cyan text-slate-100 shadow-sm shadow-hud-cyan/20"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSel ? "text-hud-cyan" : "text-slate-500"}`} />
                        <span className="font-mono text-xs font-bold">{act.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{act.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Parameter Input */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. Target URL or Query Expression
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter domain, URL, or research topic..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-hud-cyan transition-all"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets[activeAction]?.map((pre, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTarget(pre)}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-slate-100 transition-colors"
                  >
                    {pre.length > 32 ? `${pre.substring(0, 32)}...` : pre}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunInspect}
              disabled={isRunning || !target.trim()}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-hud-cyan to-teal-400 hover:opacity-95 active:scale-[0.99] text-slate-950 font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-hud-cyan/20 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "INVOKING ANAKIN REST API..." : `DISPATCH ${activeAction.toUpperCase()}`}
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-hud-cyan font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>CONFIG LOCATION (.ENV)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Your API key is securely loaded from <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">.env</code> in the project root:
            </p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-hud-cyan">
              ANAKIN_API_KEY=your_key_here
            </div>
            <p className="text-[10px] text-slate-500">
              When edited, click <strong>"Reload .env Key"</strong> above to instantly activate without server restart.
            </p>
          </div>
        </div>

        {/* Live Output Column */}
        <div className="lg:col-span-7">
          <div className="h-full min-h-[460px] p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
            {/* Output Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-hud-cyan" />
                <span className="font-mono text-xs font-bold text-slate-200">
                  TELEMETRY OUTPUT
                </span>
                {result && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    result.status === "success" 
                      ? "bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40"
                      : "bg-hud-rose/20 text-hud-rose border border-hud-rose/40"
                  }`}>
                    {result.status === "success" ? `200 OK (${result.duration_ms}ms)` : "ERROR"}
                  </span>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => setActiveTab("formatted")}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeTab === "formatted" ? "bg-hud-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    View Result
                  </button>
                  <button
                    onClick={() => setActiveTab("raw")}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeTab === "raw" ? "bg-hud-cyan text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 overflow-auto max-h-[520px]">
              {isRunning ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-10 h-10 rounded-full border-2 border-hud-cyan border-t-transparent animate-spin" />
                  <p className="font-mono text-xs text-slate-300">
                    Executing official Anakin API request for <span className="text-hud-cyan">{target}</span>...
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Applying rate limiting safeguards, secret isolation & TLS handshake
                  </p>
                </div>
              ) : result ? (
                activeTab === "raw" ? (
                  <pre className="p-4 rounded-lg bg-slate-950 text-xs font-mono text-hud-cyan border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-4">
                    {/* Execution Meta Card */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Action</span>
                        <span className="text-xs font-mono font-bold text-hud-cyan uppercase">{result.action}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Duration</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{result.duration_ms} ms</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Mode</span>
                        <span className="text-xs font-mono font-bold text-hud-emerald">
                          {result.has_api_key ? "Live Anakin" : "Demo Fallback"}
                        </span>
                      </div>
                    </div>

                    {/* Data Details */}
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
                        Response Payload:
                      </h4>

                      {result.data?.markdown && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-hud-cyan">EXTRACTED MARKDOWN:</span>
                          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                            {result.data.markdown}
                          </div>
                        </div>
                      )}

                      {result.data?.findings && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-hud-amber">RESEARCH FINDINGS:</span>
                          <p className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                            {result.data.findings}
                          </p>
                        </div>
                      )}

                      {Array.isArray(result.data) && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-hud-emerald">DISCOVERED ACTIONS ({result.data.length}):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {result.data.map((act: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                                <div className="font-bold text-slate-200">{act.name}</div>
                                <div className="text-[10px] text-hud-cyan">{act.action_id}</div>
                                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{act.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.data?.nodes && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-hud-cyan">MAPPED TOPOLOGY ({result.data.nodes?.length || 0} nodes):</span>
                          <pre className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs">
                  <Terminal className="w-10 h-10 mb-3 text-slate-700" />
                  <p>Ready for live inspection.</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Select a capability on the left and click Dispatch to invoke.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
