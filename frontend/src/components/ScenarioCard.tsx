"use client";

import React from "react";
import { Scenario } from "../lib/types";
import {
  Zap,
  Shield,
  Award,
  Layers,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected?: boolean;
  onSelect: (scenario: Scenario) => void;
  onExecute: (scenario: Scenario) => void;
  isExecuting?: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isSelected = false,
  onSelect,
  onExecute,
  isExecuting = false,
}) => {
  return (
    <div
      onClick={() => onSelect(scenario)}
      className={`glass-panel p-5 rounded-xl cursor-pointer transition-all duration-300 relative border ${
        isSelected
          ? "border-hud-cyan bg-hud-cyan/[0.04] shadow-lg shadow-hud-cyan/10"
          : "border-surface-border hover:border-slate-700"
      }`}
    >
      {/* Recommended Ribbon */}
      {scenario.recommended && (
        <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-hud-emerald text-slate-950 font-mono text-[10px] font-bold tracking-wide flex items-center gap-1 shadow-md">
          <Award className="w-3 h-3" />
          RECOMMENDED STRATEGY
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            SIMULATOR PATHWAY
          </span>
          <h3 className="text-base font-bold text-slate-100 font-mono mt-0.5">
            {scenario.scenario}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-hud-cyan">
            {scenario.score}
          </span>
          <span className="text-xs font-mono text-slate-500">/100</span>
          <div className="text-[9px] font-mono text-slate-400">OPPORTUNITY SCORE</div>
        </div>
      </div>

      {/* Metric Bars: Benefit, Risk, Complexity */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4 text-xs font-mono">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>BENEFIT</span>
            <span className="text-hud-emerald font-bold">{scenario.benefit}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-hud-emerald" style={{ width: `${scenario.benefit}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>RISK</span>
            <span className="text-hud-rose font-bold">{scenario.risk}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-hud-rose" style={{ width: `${scenario.risk}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>COMPLEXITY</span>
            <span className="text-hud-amber font-bold">{scenario.complexity}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-hud-amber" style={{ width: `${scenario.complexity}%` }} />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-slate-300 font-sans leading-relaxed mb-5">
        {scenario.reasoning}
      </p>

      {/* Footer Execute Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-500">
          ESTIMATED SIMULATION
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExecute(scenario);
          }}
          disabled={isExecuting}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            scenario.recommended
              ? "bg-hud-cyan text-slate-950 hover:bg-hud-cyan/90 shadow-md shadow-hud-cyan/20"
              : "bg-surface border border-slate-700 text-slate-200 hover:border-hud-cyan"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isExecuting ? "DISPATCHING WIRE..." : "EXECUTE STRATEGY"}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
