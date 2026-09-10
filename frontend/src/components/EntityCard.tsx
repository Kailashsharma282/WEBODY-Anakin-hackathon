"use client";

import React, { useState } from "react";
import { GraphNode } from "../lib/types";
import {
  Building2,
  Globe2,
  Cpu,
  Layers,
  Shield,
  Activity,
  Calendar,
  Compass,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  X
} from "lucide-react";

interface EntityCardProps {
  entity: GraphNode | null;
  profileData?: any;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  profileData,
  onClose,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");

  if (!entity) return null;

  const tabs = [
    "overview",
    "current state",
    "recent changes",
    "why it matters",
    "related entities",
    "timeline",
    "predictions",
    "actions"
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl glass-panel bg-surface/95 border-l border-hud-cyan/30 p-6 flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40 uppercase">
              {entity.type}
            </span>
            <span className="text-xs font-mono text-slate-400">
              IMPORTANCE: <strong className="text-slate-200">{entity.importance}%</strong>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-mono mt-1 flex items-center gap-2">
            {entity.name}
          </h2>
          {entity.domain && (
            <a
              href={`https://${entity.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-slate-400 hover:text-hud-cyan flex items-center gap-1 mt-0.5"
            >
              {entity.domain} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-surface text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sub-navigation for Section 15 Sections */}
      <div className="flex items-center gap-1 overflow-x-auto py-3 border-b border-slate-800/80 text-xs font-mono no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-2.5 py-1 rounded-md uppercase whitespace-nowrap text-[11px] transition-colors ${
              activeSubTab === tab
                ? "bg-hud-cyan text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs font-mono">
        {activeSubTab === "overview" && (
          <div className="space-y-4 font-sans">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-mono text-hud-cyan uppercase font-bold mb-2">
                OVERVIEW
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {entity.description ||
                  `${entity.name} is a key node in the living world model tracked with real-time web monitoring and AI visibility telemetry.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500">STATUS</span>
                <div className="text-sm font-bold text-hud-emerald uppercase mt-0.5">
                  {entity.status}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-500">IMPORTANCE SCORE</span>
                <div className="text-sm font-bold text-hud-cyan mt-0.5">
                  {entity.importance}/100
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "current state" && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono text-hud-cyan uppercase font-bold">
              CURRENT STRATEGIC STATE
            </h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Entity is currently evaluated as aggressively expanding enterprise AI governance
              and compliance tiers to pressure category competitors.
            </p>
            <div className="p-2.5 rounded bg-hud-rose/10 border border-hud-rose/30 text-hud-rose text-xs">
              ACTIVE PRICING WAR / DIFFERENTIATION PHASE
            </div>
          </div>
        )}

        {activeSubTab === "recent changes" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-hud-rose font-bold">PRICE DROP (-22%)</span>
              <p className="text-slate-300 text-xs mt-1 font-sans">
                Enterprise pricing reduced to $7,800/mo with bundled AI Guardrails.
              </p>
              <span className="text-[10px] text-slate-500 mt-2 block">Detected 09:42 UTC</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-hud-cyan font-bold">DOCUMENTATION UPDATED</span>
              <p className="text-slate-300 text-xs mt-1 font-sans">
                New API documentation added for automated compliance auditor endpoints.
              </p>
              <span className="text-[10px] text-slate-500 mt-2 block">Detected 09:35 UTC</span>
            </div>
          </div>
        )}

        {activeSubTab === "why it matters" && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono text-hud-amber uppercase font-bold">
              STRATEGIC RELEVANCE TO ACME AI
            </h4>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              If left unaddressed, enterprise buyers will leverage this price reduction during
              Q3 renewal cycles. Bundling our Governance Suite v2 provides an immediate moat
              without sacrificing revenue margins.
            </p>
          </div>
        )}

        {activeSubTab === "related entities" && (
          <div className="space-y-2">
            {profileData?.related_entities && profileData.related_entities.length > 0 ? (
              profileData.related_entities.map((rel: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-200">{rel.name}</span>
                    <div className="text-[10px] text-slate-500 uppercase">{rel.relationship}</div>
                  </div>
                  <span className="text-hud-cyan text-xs">{rel.current_value}</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-200">Acme AI</span>
                  <div className="text-[10px] text-slate-500 uppercase">COMPETES WITH</div>
                </div>
                <span className="text-hud-rose text-xs">Pricing & Governance</span>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "timeline" && (
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-hud-cyan font-bold">Today</span>
              <p className="text-slate-300 text-xs mt-1 font-sans">Enterprise pricing changed -22%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-bold">14 Days Ago</span>
              <p className="text-slate-300 text-xs mt-1 font-sans">Hiring spike for Security Compliance Lead</p>
            </div>
          </div>
        )}

        {activeSubTab === "predictions" && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-hud-violet font-bold">ORACLE FORECAST (84% Probability)</span>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              Likely broader enterprise AI governance platform launch within 30 days.
            </p>
          </div>
        )}

        {activeSubTab === "actions" && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-hud-emerald font-bold">DISPATCHED WIRE ACTIONS</span>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              Action <code className="text-hud-cyan">github.issue.create</code> executed to counter strategic moves.
            </p>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500">ENTITY ID: {entity.id.slice(0, 8)}...</span>
        {onNavigateToTab && (
          <button
            onClick={() => {
              onClose();
              onNavigateToTab("TIMELINE");
            }}
            className="flex items-center gap-1 text-hud-cyan hover:underline"
          >
            VIEW FULL TIMELINE <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
