"use client";

import React, { useState } from "react";
import { AgentTrailStep } from "../lib/types";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Wrench,
  Globe,
  Activity,
  Layers
} from "lucide-react";

interface AgentTrailProps {
  trail: AgentTrailStep[];
  isExpandedDefault?: boolean;
}

export const AgentTrail: React.FC<AgentTrailProps> = ({
  trail,
  isExpandedDefault = true,
}) => {
  const [expanded, setExpanded] = useState(isExpandedDefault);

  const phaseColors = {
    OBSERVE: "text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10",
    UNDERSTAND: "text-hud-violet border-hud-violet/40 bg-hud-violet/10",
    PREDICT: "text-hud-amber border-hud-amber/40 bg-hud-amber/10",
    SIMULATE: "text-hud-emerald border-hud-emerald/40 bg-hud-emerald/10",
    ACT: "text-hud-rose border-hud-rose/40 bg-hud-rose/10",
  };

  return (
    <div className="glass-panel rounded-xl border border-surface-border overflow-hidden transition-all duration-300">
      {/* Clickable Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-slate-800 text-hud-cyan">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-mono font-bold text-slate-200 tracking-wider">
              AUTONOMOUS AGENT TRAIL ({trail.length} PHASES)
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              OBSERVE → UNDERSTAND → PREDICT → SIMULATE → ACT
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono">
            {trail.map((step, idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded border ${
                  phaseColors[step.phase] || "text-slate-400 border-slate-700"
                }`}
              >
                {step.phase} ✓
              </span>
            ))}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Trail View */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3">
          {trail.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all text-xs font-mono"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      phaseColors[step.phase]
                    }`}
                  >
                    {step.phase} ✓
                  </span>
                  <span className="font-semibold text-slate-200">
                    {step.state}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {step.duration_ms}ms
                  </span>
                  <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-hud-cyan" />
                  <span>TOOL: <strong className="text-slate-300">{step.tool}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-hud-violet" />
                  <span>SOURCE: <strong className="text-slate-300">{step.source}</strong></span>
                </div>
              </div>

              {step.details && Object.keys(step.details).length > 0 && (
                <div className="mt-2 text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded flex flex-wrap gap-3">
                  {Object.entries(step.details).map(([k, v]) => (
                    <span key={k}>
                      {k.toUpperCase()}: <span className="text-slate-300">{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
