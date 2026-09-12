"use client";

import React, { useState } from "react";
import { Sliders, Shield, Zap, TrendingUp, RotateCcw, BrainCircuit } from "lucide-react";
import { api } from "../lib/api";

interface ScenarioSimulatorControlsProps {
  onWeightsChange?: (weights: {
    riskAversion: number;
    marginDefense: number;
    differentiation: number;
  }) => void;
}

export function ScenarioSimulatorControls({ onWeightsChange }: ScenarioSimulatorControlsProps) {
  const [riskAversion, setRiskAversion] = useState<number>(35);
  const [marginDefense, setMarginDefense] = useState<number>(60);
  const [differentiation, setDifferentiation] = useState<number>(75);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [persona, setPersona] = useState<string>("VALUE DIFFERENTIATOR / MARGIN DEFENDER");

  const handleUpdate = async (newRisk: number, newMargin: number, newDiff: number) => {
    setRiskAversion(newRisk);
    setMarginDefense(newMargin);
    setDifferentiation(newDiff);

    if (onWeightsChange) {
      onWeightsChange({
        riskAversion: newRisk,
        marginDefense: newMargin,
        differentiation: newDiff,
      });
    }

    // Determine executive persona
    if (newDiff >= 70 && newMargin >= 50) {
      setPersona("STRATEGIC VALUE DIFFERENTIATOR (PREMIUM PRICING MOAT)");
    } else if (newRisk <= 30 && newMargin <= 40) {
      setPersona("AGGRESSIVE MARKET-SHARE ACQUIRER (PRICE MATCH)");
    } else {
      setPersona("BALANCED ENTERPRISE RISK-RETURN POSTURE");
    }

    try {
      setIsSyncing(true);
      await api.recordRLHFDecision({
        chosen_scenario: newDiff >= 60 ? "Scenario C: DIFFERENTIATE" : "Scenario B: MATCH PRICE",
        score: Math.round((newDiff + newMargin) / 2),
        risk: 100 - newRisk,
        benefit: newDiff,
        complexity: 35,
        rejected_scenarios: ["Scenario A: DO NOTHING"],
      });
    } catch (e) {
      // Background sync
    } finally {
      setIsSyncing(false);
    }
  };

  const resetDefaults = () => {
    handleUpdate(35, 60, 75);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-xl border border-hud-cyan/30 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/30 neon-glow-cyan">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                RLHF STRATEGIC POSTURE SIMULATOR
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-hud-violet/20 text-hud-violet border border-hud-violet/30">
                HUMAN-IN-THE-LOOP ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-hud-cyan mt-0.5">
              CURRENT POSTURE: <strong className="text-slate-200">{persona}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 transition-all"
        >
          <RotateCcw className="w-3 h-3" /> RESET BENCHMARK
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Slider 1: Risk Aversion */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-hud-rose" /> Risk Aversion
            </span>
            <span className="font-bold text-hud-rose">{riskAversion}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            value={riskAversion}
            onChange={(e) => handleUpdate(Number(e.target.value), marginDefense, differentiation)}
            className="w-full accent-hud-rose cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Aggressive (10%)</span>
            <span>Conservative (95%)</span>
          </div>
        </div>

        {/* Slider 2: Margin Defense */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-hud-amber" /> Margin Defense
            </span>
            <span className="font-bold text-hud-amber">{marginDefense}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            value={marginDefense}
            onChange={(e) => handleUpdate(riskAversion, Number(e.target.value), differentiation)}
            className="w-full accent-hud-amber cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Price Match War</span>
            <span>Defend Gross Margins</span>
          </div>
        </div>

        {/* Slider 3: Differentiation Moat */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-hud-emerald" /> Value Differentiation
            </span>
            <span className="font-bold text-hud-emerald">{differentiation}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            value={differentiation}
            onChange={(e) => handleUpdate(riskAversion, marginDefense, Number(e.target.value))}
            className="w-full accent-hud-emerald cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Generic Packaging</span>
            <span>Compliance & SLA Moat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
