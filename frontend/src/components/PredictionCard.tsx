"use client";

import React from "react";
import { Prediction } from "../lib/types";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  Compass,
  CheckCircle2,
  XCircle,
  SlidersHorizontal
} from "lucide-react";

interface PredictionCardProps {
  prediction: Prediction;
  onSimulate?: (prediction: Prediction) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  onSimulate,
}) => {
  // Uncertainty is 100 - confidence
  const uncertainty = Math.max(0, 100 - prediction.confidence);

  return (
    <div className="glass-panel p-5 rounded-xl border border-surface-border transition-all duration-300 hover:border-hud-violet/50">
      {/* Top Section / Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-violet/15 text-hud-violet border border-hud-violet/40 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            ORACLE FORECAST
          </span>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> TIME WINDOW: <strong className="text-slate-200">{prediction.time_window}</strong>
          </span>
        </div>

        {/* Explicit labels required by Section 18 */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">PREDICTION</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-hud-cyan">PROBABILITY</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-hud-emerald">CONFIDENCE</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-hud-amber">EVIDENCE</span>
        </div>
      </div>

      {/* Main Prediction Statement */}
      <h3 className="text-base font-bold text-slate-100 font-mono mb-3">
        "{prediction.prediction}"
      </h3>

      {/* Probability & Uncertainty Visualizer */}
      <div className="mb-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-slate-400">
            PROBABILITY: <strong className="text-hud-cyan text-sm">{prediction.probability}%</strong>
          </span>
          <span className="text-slate-400">
            CONFIDENCE: <strong className="text-hud-emerald">{prediction.confidence}%</strong> • UNCERTAINTY:{" "}
            <strong className="text-hud-rose">{uncertainty}%</strong>
          </span>
        </div>

        {/* Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-hud-cyan transition-all duration-500"
            style={{ width: `${prediction.probability}%` }}
          />
          <div
            className="h-full bg-hud-rose/50 transition-all duration-500"
            style={{ width: `${uncertainty}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>0%</span>
          <span>50% UNCERTAINTY BOUND</span>
          <span>100%</span>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
        <strong className="font-mono text-slate-400">REASONING: </strong>
        {prediction.reasoning}
      </p>

      {/* Supporting vs Contradicting Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800">
          <span className="text-[11px] text-hud-emerald font-bold flex items-center gap-1 mb-1.5">
            <CheckCircle2 className="w-3 h-3" /> SUPPORTING SIGNALS ({prediction.supporting_signals.length})
          </span>
          <ul className="space-y-1 text-slate-300">
            {prediction.supporting_signals.map((sig, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1">
                <span className="text-hud-emerald">✓</span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800">
          <span className="text-[11px] text-hud-amber font-bold flex items-center gap-1 mb-1.5">
            <XCircle className="w-3 h-3" /> CONTRADICTING SIGNALS ({prediction.contradicting_signals.length})
          </span>
          <ul className="space-y-1 text-slate-400">
            {prediction.contradicting_signals.map((sig, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1">
                <span className="text-hud-amber">×</span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer warning & trigger */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-hud-amber" />
          FORECAST IS ESTIMATED PROBABILITY, NOT AN EMPIRICAL FACT.
        </span>
        {onSimulate && (
          <button
            onClick={() => onSimulate(prediction)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hud-emerald/15 hover:bg-hud-emerald/25 border border-hud-emerald/40 text-hud-emerald text-xs font-mono font-bold transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            SIMULATE RESPONSES
          </button>
        )}
      </div>
    </div>
  );
};
