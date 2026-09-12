"use client";

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Swords,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Hash
} from "lucide-react";

interface Turn {
  turn: number;
  actor: "BLUE_TEAM" | "RED_TEAM";
  actor_name: string;
  horizon_days: string;
  title: string;
  action: string;
  strategic_impact: string;
  defensibility_delta: string;
}

interface WarRoomResult {
  simulation_id: string;
  brand_name: string;
  competitor_name: string;
  primary_scenario: string;
  strategy_type: string;
  market_defensibility_score: number;
  churn_risk_mitigated: number;
  equilibrium_stability: string;
  nash_recommendation: string;
  turns: Turn[];
  provenance_hash: string;
  simulated_at: string;
}

export const WarRoomSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>("Differentiate with Governance Bundle");
  const [brandName, setBrandName] = useState<string>("Acme AI");
  const [competitorName, setCompetitorName] = useState<string>("Competitor X");
  const [diffPriority, setDiffPriority] = useState<number>(85);
  const [marginPriority, setMarginPriority] = useState<number>(50);
  const [riskAversion, setRiskAversion] = useState<number>(45);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warData, setWarData] = useState<WarRoomResult | null>(null);

  useEffect(() => {
    runSimulation();
  }, []);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await api.runWarRoomSimulation({
        primary_scenario: selectedScenario,
        brand_name: brandName,
        competitor_name: competitorName,
        differentiation_priority: diffPriority / 100,
        margin_priority: marginPriority / 100,
        risk_aversion: riskAversion / 100
      });
      setWarData(res);
    } catch (err) {
      console.error("War room simulation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-rose/20 text-hud-rose border border-hud-rose/40 flex items-center gap-1">
              <Swords className="w-3 h-3" />
              GAME THEORY WAR ROOM
            </span>
            <span className="text-slate-500 text-[10px] font-mono">90-DAY MULTI-TURN EQUILIBRIUM</span>
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100 mt-1">
            Adversarial Counter-Reaction Simulator
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Simulates what happens AFTER our action: competitor retaliation personas & 2nd-order Nash equilibrium defensibility.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hud-rose hover:bg-rose-500 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-hud-rose/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "CALCULATING EQUILIBRIUM..." : "RE-SIMULATE WAR ROOM"}
        </button>
      </div>

      {/* Control Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
        <div>
          <label className="text-slate-400 block mb-1 uppercase text-[10px]">Primary Strategic Stance</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-hud-cyan outline-none text-xs"
          >
            <option value="Differentiate with Governance Bundle">Differentiate with Governance Bundle (Asymmetric)</option>
            <option value="Match Competitor 22% Price Cut">Match Price Directly (Symmetric Price War)</option>
            <option value="Protect Top 20% Accounts Only">Selective VIP Defense (Segmented Defense)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 uppercase text-[10px] flex justify-between">
            <span>Differentiation Weight</span>
            <span className="text-hud-cyan font-bold">{diffPriority}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={diffPriority}
            onChange={(e) => setDiffPriority(Number(e.target.value))}
            className="w-full accent-hud-cyan cursor-pointer"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 uppercase text-[10px] flex justify-between">
            <span>Margin Defense Priority</span>
            <span className="text-hud-amber font-bold">{marginPriority}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={marginPriority}
            onChange={(e) => setMarginPriority(Number(e.target.value))}
            className="w-full accent-hud-amber cursor-pointer"
          />
        </div>
      </div>

      {/* Simulation Result View */}
      {warData && (
        <div className="space-y-6">
          {/* Executive Scorecard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">90-Day Defensibility Index</span>
              <div className="text-3xl font-black font-mono text-hud-emerald mt-1">
                {warData.market_defensibility_score}<span className="text-base text-slate-400">/100</span>
              </div>
              <span className="text-[10px] font-mono text-hud-emerald">
                Equilibrium: {warData.equilibrium_stability.replace("_", " ")}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Churn Mitigation</span>
              <div className="text-3xl font-black font-mono text-hud-cyan mt-1">
                +{warData.churn_risk_mitigated}%
              </div>
              <span className="text-[10px] font-mono text-slate-400">Enterprise accounts retained</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Strategy Posture</span>
              <div className="text-sm font-bold font-mono text-hud-violet mt-2 truncate">
                {warData.strategy_type.replace("_", " ")}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-1 truncate">
                <Hash className="w-3 h-3 text-hud-cyan" />
                <span>SHA-256: {warData.provenance_hash.slice(0, 16)}...</span>
              </div>
            </div>
          </div>

          {/* 3-Turn Sequential Chess Playback */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-hud-cyan" />
              Sequential Equilibrium Trajectory (30 / 60 / 90 Days)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warData.turns.map((t) => {
                const isBlue = t.actor === "BLUE_TEAM";
                return (
                  <div
                    key={t.turn}
                    className={`p-4 rounded-xl border flex flex-col justify-between text-xs font-mono transition-all ${
                      isBlue
                        ? "bg-slate-950/80 border-hud-cyan/40 hover:border-hud-cyan"
                        : "bg-rose-950/20 border-hud-rose/40 hover:border-hud-rose"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBlue
                              ? "bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/30"
                              : "bg-hud-rose/20 text-hud-rose border border-hud-rose/30"
                          }`}
                        >
                          {isBlue ? "BLUE MOVE" : "RED COUNTER"} • {t.horizon_days}
                        </span>
                        <span className={`text-[11px] font-bold ${t.defensibility_delta.startsWith("+") ? "text-hud-emerald" : "text-hud-rose"}`}>
                          {t.defensibility_delta}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm mb-2">{t.title}</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed mb-3">{t.action}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <strong className="text-slate-200">STRATEGIC IMPACT: </strong>
                      {t.strategic_impact}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactical Recommendation Bar */}
          <div className="p-4 rounded-xl bg-hud-cyan/10 border border-hud-cyan/30 text-xs font-mono text-slate-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-hud-cyan flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-hud-cyan uppercase tracking-wider block">Game-Theoretic Recommendation:</strong>
              <p className="mt-0.5 text-slate-300 leading-relaxed">{warData.nash_recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
