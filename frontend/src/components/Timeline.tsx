"use client";

import React, { useState } from "react";
import { TimelineEvent } from "../lib/types";
import {
  Clock,
  Calendar,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Filter
} from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
  entityName?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  entityName = "Ecosystem Entity",
}) => {
  const [filterImpact, setFilterImpact] = useState<string>("all");

  const impactColors = {
    critical: "bg-hud-rose/15 text-hud-rose border-hud-rose/40",
    high: "bg-hud-amber/15 text-hud-amber border-hud-amber/40",
    medium: "bg-hud-cyan/15 text-hud-cyan border-hud-cyan/40",
    low: "bg-slate-800 text-slate-400 border-slate-700",
  };

  const filteredEvents = events.filter((e) => {
    if (filterImpact === "all") return true;
    return e.impact.toLowerCase() === filterImpact.toLowerCase();
  });

  return (
    <div className="glass-panel p-6 rounded-xl border border-surface-border">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-hud-cyan uppercase tracking-wider font-bold">
            TEMPORAL GRAPH HISTORICAL REPLAY
          </div>
          <h3 className="text-lg font-bold text-slate-100 font-mono mt-0.5">
            {entityName} Event Chronology
          </h3>
        </div>

        {/* Scrubbing & Filters */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">IMPACT:</span>
          {["all", "critical", "high", "medium"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterImpact(lvl)}
              className={`px-2 py-1 rounded uppercase text-[10px] transition-colors ${
                filterImpact === lvl
                  ? "bg-hud-cyan text-slate-950 font-bold"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative mt-6 pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filteredEvents.length === 0 ? (
          <div className="text-xs font-mono text-slate-500 py-6 text-center">
            NO TIMELINE EVENTS RECORDED FOR THIS FILTER CRITERIA.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const dateObj = new Date(ev.timestamp);
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            const timeStr = dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={ev.id} className="relative group">
                {/* Timeline node icon on vertical line */}
                <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-hud-cyan group-hover:bg-hud-cyan group-hover:scale-125 transition-all duration-200" />

                <div className="glass-panel p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {dateStr}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {timeStr}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                          impactColors[ev.impact as keyof typeof impactColors] || impactColors.medium
                        }`}
                      >
                        {ev.impact} IMPACT
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                      <span>CONFIDENCE: <strong className="text-hud-emerald">{ev.confidence}%</strong></span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase">
                        {ev.event_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 font-sans mb-1 group-hover:text-hud-cyan transition-colors">
                    {ev.title}
                  </h4>

                  {ev.description && (
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <span>RECORDED VIA:</span>
                    <span className="text-slate-400">{ev.source}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
