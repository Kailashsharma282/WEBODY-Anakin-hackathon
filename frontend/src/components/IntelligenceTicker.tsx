"use client";

import React from "react";
import { Radio, ArrowUpRight, TrendingDown, ShieldAlert, Zap, Globe } from "lucide-react";

interface TickerItem {
  id: string;
  source: string;
  headline: string;
  badge: string;
  color: "cyan" | "rose" | "emerald" | "amber";
  time: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: "t1",
    source: "SENTINEL CRAWLER",
    headline: "COMPETITOR X: Enterprise Tier cut by -22% to $7,800/mo (Free Governance Included)",
    badge: "CRITICAL SHIFT",
    color: "rose",
    time: "2m ago"
  },
  {
    id: "t2",
    source: "ANAKIN WIRE",
    headline: "AWS BEDROCK: Batch API discounts expanded to 50% for Claude 3.5 Sonnet",
    badge: "CLOUD COST",
    color: "amber",
    time: "14m ago"
  },
  {
    id: "t3",
    source: "AI CITATION RADAR",
    headline: "ACME AI: Enterprise recommendation rate up +18% on Gemini 1.5 Pro benchmarks",
    badge: "RADAR UP",
    color: "emerald",
    time: "26m ago"
  },
  {
    id: "t4",
    source: "CARTOGRAPHER",
    headline: "NEW TOPOLOGY DISCOVERED: 42 new enterprise endpoints mapped for Competitor X",
    badge: "MAP EXPANDED",
    color: "cyan",
    time: "41m ago"
  },
  {
    id: "t5",
    source: "EU REGULATORY WATCH",
    headline: "EU AI ACT: Mandatory Conformity Assessment enacted for General Purpose AI",
    badge: "GOVERNANCE",
    color: "rose",
    time: "1h ago"
  }
];

interface IntelligenceTickerProps {
  onOpenDiff?: () => void;
}

export function IntelligenceTicker({ onOpenDiff }: IntelligenceTickerProps) {
  // Duplicate for seamless infinite loop
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
