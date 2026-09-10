"use client";

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Brain,
  Gauge,
  Sliders,
  Scale,
  RefreshCw,
  Award,
  Layers,
  CheckCircle2,
  ChevronRight,
  Radar
} from "lucide-react";

export const NextGenHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"governor" | "adversarial" | "radar" | "rlhf">("governor");
  
  // State for Next-Gen modules
  const [volatilityData, setVolatilityData] = useState<any>(null);
  const [debateData, setDebateData] = useState<any>(null);
  const [radarData, setRadarData] = useState<any>(null);
  const [rlhfProfile, setRlhfProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadGovernor();
    loadRadar();
    loadRLHF();
  }, []);

  const loadGovernor = async () => {
    try {
      const data = await api.getGovernorVolatility("Competitor X");
      setVolatilityData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRadar = async () => {
    try {
      const data = await api.getCrossLLMRadar();
      setRadarData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRLHF = async () => {
    try {
      const data = await api.getRLHFProfile();
      setRlhfProfile(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunDebate = async () => {
    setIsLoading(true);
    try {
      const res = await api.runAdversarialDebate(
        "Competitor reduced enterprise pricing by 22%",
        "Competitor X",
        "Discounts applied with automated compliance hooks."
      );
      setDebateData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyGovernor = async () => {
    setIsLoading(true);
    try {
      await api.applyGovernor();
      await loadGovernor();
      alert("Adaptive Volatility Governor applied! All watch frequencies calibrated.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-surface-border space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-violet/20 text-hud-violet border border-hud-violet/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              NEXT-GEN ENHANCEMENTS SUITE
            </span>
            <span className="text-[10px] font-mono text-hud-emerald border border-hud-emerald/30 px-2 py-0.5 rounded bg-hud-emerald/10">
              ENTERPRISE COGNITION ACTIVE
            </span>
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-100 mt-1">
            Autonomous Optimization & Multi-Agent Intelligence
          </h2>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {[
            { id: "governor", label: "VOLATILITY GOVERNOR", icon: Gauge },
            { id: "adversarial", label: "ADVERSARIAL ORACLE", icon: Scale },
            { id: "radar", label: "CROSS-LLM RADAR", icon: Radar },
            { id: "rlhf", label: "RLHF PREFERENCE", icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-hud-cyan text-slate-950 font-bold shadow-md shadow-hud-cyan/20"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. VOLATILITY GOVERNOR VIEW */}
      {activeSubTab === "governor" && (
        <div className="space-y-6 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 uppercase">VOLATILITY SCORE</span>
              <div className="text-3xl font-black text-hud-rose mt-1">
                {volatilityData?.volatility_score || 85}
                <span className="text-sm text-slate-500 font-normal">/100</span>
              </div>
              <span className="text-[10px] text-hud-rose font-bold block mt-1">
                {volatilityData?.status || "HIGH VOLATILITY (SURGE MONITORING)"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 uppercase">ESTIMATED API QUOTA SAVINGS</span>
              <div className="text-3xl font-black text-hud-emerald mt-1">
                {volatilityData?.estimated_quota_savings_pct || 64}%
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Dynamic adaptive decay vs. static polling
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 uppercase">SURVEILLANCE CADENCE</span>
              <div className="text-2xl font-bold text-hud-cyan mt-1">
                {volatilityData?.recommended_frequency || "5m"} SURGE
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Calibrated to recent price cuts & hiring surge
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-200 font-bold text-sm">
                Apply Governor to All Active Watch Targets
              </div>
              <div className="text-slate-400 text-[11px]">
                Dynamically switches stable targets to daily checks and surging competitors to 5-minute intervals.
              </div>
            </div>
            <button
              onClick={handleApplyGovernor}
              disabled={isLoading}
              className="px-4 py-2 bg-hud-cyan text-slate-950 rounded-lg font-bold hover:bg-hud-cyan/90 transition-all shadow-md shadow-hud-cyan/20"
            >
              {isLoading ? "APPLYING..." : "CALIBRATE WATCHLIST"}
            </button>
          </div>
        </div>
      )}

      {/* 2. ADVERSARIAL ORACLE VIEW */}
      {activeSubTab === "adversarial" && (
        <div className="space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between">
            <p className="text-slate-300 font-sans">
              Conducts an automated multi-agent debate between an aggressive Bull Agent and a skeptical Bear Agent to eliminate hallucinations and output calibrated Bayesian probabilities.
            </p>
            <button
              onClick={handleRunDebate}
              disabled={isLoading}
              className="px-4 py-2 bg-hud-violet text-slate-950 rounded-lg font-bold hover:bg-hud-violet/90 transition-all whitespace-nowrap shadow-md shadow-hud-violet/20"
            >
              {isLoading ? "DEBATING..." : "START ADVERSARIAL DEBATE"}
            </button>
          </div>

          {debateData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bull Agent */}
                <div className="p-4 rounded-xl bg-hud-rose/5 border border-hud-rose/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-hud-rose text-sm">
                      {debateData.bull_agent.agent}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-hud-rose/20 text-hud-rose text-[10px]">
                      {debateData.bull_agent.projected_probability}% PROJ.
                    </span>
                  </div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">
                    STANCE: {debateData.bull_agent.stance}
                  </div>
                  <ul className="space-y-1 text-slate-200 text-[11px] font-sans">
                    {debateData.bull_agent.arguments.map((arg: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-hud-rose">•</span> {arg}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bear Agent */}
                <div className="p-4 rounded-xl bg-hud-cyan/5 border border-hud-cyan/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-hud-cyan text-sm">
                      {debateData.bear_agent.agent}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-hud-cyan/20 text-hud-cyan text-[10px]">
                      {debateData.bear_agent.projected_probability}% PROJ.
                    </span>
                  </div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">
                    STANCE: {debateData.bear_agent.stance}
                  </div>
                  <ul className="space-y-1 text-slate-200 text-[11px] font-sans">
                    {debateData.bear_agent.arguments.map((arg: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-hud-cyan">•</span> {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bayesian Synthesis */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-hud-violet/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-hud-violet font-bold uppercase tracking-wider text-sm flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> BAYESIAN CALIBRATED ARBITRATION
                  </span>
                  <span className="text-slate-200 font-bold">
                    PROBABILITY: <strong className="text-hud-emerald text-base">{debateData.calibrated_probability}%</strong> • UNCERTAINTY: <strong className="text-hud-amber">{debateData.uncertainty_bound}%</strong>
                  </span>
                </div>
                <p className="text-slate-200 text-xs font-sans leading-relaxed">
                  {debateData.synthesis}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-950/40 border border-slate-800">
              CLICK "START ADVERSARIAL DEBATE" TO SIMULATE THE DUAL-AGENT FORECASTING PROVE-OUT.
            </div>
          )}
        </div>
      )}

      {/* 3. CROSS-LLM RADAR VIEW */}
      {activeSubTab === "radar" && (
        <div className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 uppercase">ACME AI AGGREGATE SHARE OF VOICE</span>
              <div className="text-3xl font-black text-hud-cyan mt-1">
                {radarData?.aggregate_brand_share_of_voice || 57}%
              </div>
              <span className="text-hud-emerald text-[10px] mt-1 block">
                Leads in {radarData?.winning_surface_count || 4} of 5 foundation models
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 uppercase">COMPETITOR X SHARE OF VOICE</span>
              <div className="text-3xl font-black text-hud-rose mt-1">
                {radarData?.aggregate_competitor_share_of_voice || 43}%
              </div>
              <span className="text-slate-400 text-[10px] mt-1 block">
                Surging exclusively on price-sensitive prompts
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {radarData?.model_breakdown?.map((m: any, i: number) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="md:w-1/3">
                  <span className="font-bold text-slate-200 text-sm">{m.model}</span>
                  <div className="text-slate-400 text-[11px] font-sans mt-0.5">{m.top_recommendation}</div>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-hud-cyan font-bold">Acme {m.brand_share_of_voice}%</span>
                    <span className="text-hud-rose font-bold">Competitor {m.competitor_share_of_voice}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-hud-cyan h-full" style={{ width: `${m.brand_share_of_voice}%` }} />
                    <div className="bg-hud-rose h-full" style={{ width: `${m.competitor_share_of_voice}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RLHF VIEW */}
      {activeSubTab === "rlhf" && (
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="text-hud-emerald uppercase tracking-wider font-bold">
              CALIBRATED EXECUTIVE STRATEGIC PERSONA
            </span>
            <p className="text-slate-200 text-sm font-sans leading-relaxed">
              {rlhfProfile?.executive_persona ||
                "Strategic Value Differentiator: Strongly prefers maintaining gross margins through feature bundling over entering destructive price wars."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rlhfProfile?.weights &&
              Object.entries(rlhfProfile.weights).map(([k, v]: [string, any]) => (
                <div key={k} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase truncate block">
                    {k.replace(/_/g, " ")}
                  </span>
                  <div className="text-xl font-bold text-hud-cyan mt-1">
                    {Math.round(v * 100)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
