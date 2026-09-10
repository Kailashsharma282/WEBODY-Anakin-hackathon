"use client";

import React from "react";
import { Signal } from "../lib/types";
import {
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

interface SignalCardProps {
  signal: Signal;
  onWhyCare: (signal: Signal) => void;
  onWhatNext: (signal: Signal) => void;
  onWhatDo: (signal: Signal) => void;
  isInvestigating?: boolean;
  isPredicting?: boolean;
  isSimulating?: boolean;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onWhyCare,
  onWhatNext,
  onWhatDo,
  isInvestigating = false,
  isPredicting = false,
  isSimulating = false,
}) => {
  const severityColors = {
    critical: "bg-hud-rose/10 text-hud-rose border-hud-rose/30",
    high: "bg-hud-amber/10 text-hud-amber border-hud-amber/30",
    medium: "bg-hud-cyan/10 text-hud-cyan border-hud-cyan/30",
    low: "bg-slate-800 text-slate-400 border-slate-700",
  };

  const actionabilityColors = {
    high: "text-hud-emerald",
    medium: "text-hud-amber",
    low: "text-slate-400",
  };

  const timeStr = new Date(signal.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="glass-panel p-5 rounded-xl border border-surface-border transition-all duration-300 hover:border-hud-cyan/40">
      {/* Top row badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {signal.is_demo ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-rose/20 text-hud-rose border border-hud-rose/50 animate-pulse">
              DEMO SIGNAL
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-hud-cyan/10 text-hud-cyan border border-hud-cyan/30">
              <Radio className="w-3 h-3 animate-ping" />
              LIVE SIGNAL
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
              severityColors[signal.severity] || severityColors.medium
            }`}
          >
            {signal.severity}
          </span>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            IMPORTANCE: <strong className="text-slate-200">{signal.importance}%</strong>
          </span>
          <span>
            CONFIDENCE: <strong className="text-slate-200">{signal.confidence}%</strong>
          </span>
        </div>
      </div>

      {/* Entity & Title */}
      <div className="mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-hud-cyan font-semibold">
          {signal.entity}
        </span>
        <h3 className="text-base font-semibold text-slate-100 mt-0.5 hover:text-hud-cyan transition-colors">
          {signal.title}
        </h3>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed line-clamp-2 font-sans">
        {signal.summary}
      </p>

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono mb-4 text-slate-400">
        <div className="flex items-center gap-2">
          <span>SOURCE:</span>
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-hud-cyan flex items-center gap-1 underline underline-offset-2"
          >
            {signal.source}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div>
          ACTIONABILITY:{" "}
          <span className={`font-bold uppercase ${actionabilityColors[signal.actionability as keyof typeof actionabilityColors] || "text-slate-300"}`}>
            {signal.actionability}
          </span>
        </div>
      </div>

      {/* The 3 Core Section 17-19 Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* WHY SHOULD I CARE? (Cortex) */}
        <button
          onClick={() => onWhyCare(signal)}
          disabled={isInvestigating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-slate-700/80 hover:border-hud-cyan hover:bg-hud-cyan/10 text-hud-cyan text-xs font-mono transition-all duration-200 disabled:opacity-50"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {isInvestigating ? "REASONING..." : "WHY SHOULD I CARE?"}
        </button>

        {/* WHAT HAPPENS NEXT? (Oracle) */}
        <button
          onClick={() => onWhatNext(signal)}
          disabled={isPredicting}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-slate-700/80 hover:border-hud-violet hover:bg-hud-violet/10 text-hud-violet text-xs font-mono transition-all duration-200 disabled:opacity-50"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {isPredicting ? "FORECASTING..." : "WHAT HAPPENS NEXT?"}
        </button>

        {/* WHAT CAN WE DO? (Simulator) */}
        <button
          onClick={() => onWhatDo(signal)}
          disabled={isSimulating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-slate-700/80 hover:border-hud-emerald hover:bg-hud-emerald/10 text-hud-emerald text-xs font-mono transition-all duration-200 disabled:opacity-50"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isSimulating ? "SIMULATING..." : "WHAT CAN WE DO?"}
        </button>
      </div>
    </div>
  );
};
