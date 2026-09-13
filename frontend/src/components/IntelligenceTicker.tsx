"use client";

import React from "react";
import { Signal } from "../lib/types";

interface TickerItem {
  id: string;
  source: string;
  headline: string;
  badge: string;
  color: "cyan" | "rose" | "emerald" | "amber";
  time: string;
}

interface IntelligenceTickerProps {
  signals?: Signal[];
  onOpenDiff?: () => void;
}

export function IntelligenceTicker({ signals, onOpenDiff }: IntelligenceTickerProps) {
  const dynamicItems: TickerItem[] = (signals && signals.length > 0)
    ? signals.map((s, idx) => ({
        id: s.id || `sig-${idx}`,
        source: (s.source || "SENTINEL STREAM").split(":")[0].toUpperCase(),
        headline: `${s.entity ? s.entity.toUpperCase() + ": " : ""}${s.title}`,
        badge: s.severity === "critical" ? "CRITICAL SHIFT" : (s.event_type?.replace("_", " ").toUpperCase() || "LIVE INTEL"),
        color: (s.severity === "critical" ? "rose" : s.importance > 85 ? "amber" : s.event_type?.includes("feature") ? "emerald" : "cyan") as "cyan" | "rose" | "emerald" | "amber",
        time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"
      }))
    : [
        {
          id: "t1",
          source: "ANAKIN MONITOR",
          headline: "OPENAI: Slashes API Pricing by 50% across Frontier Models",
          badge: "PRICE SHIFT",
          color: "rose",
          time: "Live"
        },
        {
          id: "t2",
          source: "ANAKIN SEARCH",
          headline: "ANTHROPIC: Deploys Claude 3.7 Sonnet Hybrid Reasoning Architecture",
          badge: "CAPABILITY",
          color: "emerald",
          time: "Live"
        },
        {
          id: "t3",
          source: "EU REGULATORY WATCH",
          headline: "EU AI ACT: Article 52 Mandatory Model Provenance Audit Enacted",
          badge: "GOVERNANCE",
          color: "amber",
          time: "Live"
        },
        {
          id: "t4",
          source: "CARTOGRAPHER",
          headline: "GOOGLE DEEPMIND: Gemini 2.0 Real-Time Multimodal Agent Tooling Deployed",
          badge: "MULTIMODAL",
          color: "cyan",
          time: "Live"
        }
      ];

  // Duplicate for seamless infinite loop
  const items = [...dynamicItems, ...dynamicItems];

  return (
    <div className="w-full bg-slate-950/90 border-y border-slate-800/80 py-1.5 overflow-hidden relative select-none">
      {/* Subtle glowing side fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Leading Badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-hud-rose/15 border border-hud-rose/40 text-[10px] font-mono font-bold text-hud-rose mr-3 whitespace-nowrap z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-hud-rose animate-ping" />
          <span>LIVE INTEL STREAM</span>
        </div>

        {/* Marquee Track */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-marquee flex items-center gap-8 text-xs font-mono">
            {items.map((it, idx) => (
              <div 
                key={`${it.id}-${idx}`}
                onClick={onOpenDiff}
                className="flex items-center gap-2 cursor-pointer group whitespace-nowrap"
                title="Click to inspect Side-by-Side Change Diff"
              >
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                  it.color === "rose" ? "bg-hud-rose/20 text-hud-rose border border-hud-rose/40" :
                  it.color === "emerald" ? "bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40" :
                  it.color === "amber" ? "bg-hud-amber/20 text-hud-amber border border-hud-amber/40" :
                  "bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/40"
                }`}>
                  {it.badge}
                </span>

                <span className="text-slate-300 group-hover:text-hud-cyan group-hover:underline transition-colors text-[11px]">
                  {it.headline}
                </span>

                <span className="text-[10px] text-slate-500">
                  {it.time}
                </span>

                <span className="text-slate-700 font-bold ml-2">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
