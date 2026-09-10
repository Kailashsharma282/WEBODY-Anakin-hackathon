"use client";

import React from "react";
import { Investigation } from "../lib/types";
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  X,
  Target,
  ChevronRight
} from "lucide-react";

interface EvidencePanelProps {
  investigation: Investigation | null;
  onClose: () => void;
  onProceedToOracle?: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  investigation,
  onClose,
  onProceedToOracle,
}) => {
  if (!investigation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-2xl border border-hud-cyan/40 p-6 flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40">
                CORTEX INVESTIGATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                THEME: <strong className="text-slate-200">{investigation.strategic_theme}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2 font-mono">
              {investigation.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          {/* Section: Why it matters / Interpretation */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-mono uppercase tracking-wider text-hud-cyan font-bold mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              STRATEGIC INTERPRETATION ("WHY SHOULD I CARE?")
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {investigation.interpretation}
            </p>
            <div className="mt-3 flex gap-4 text-xs font-mono text-slate-400 border-t border-slate-800 pt-2">
              <span>CONFIDENCE: <strong className="text-hud-emerald">{investigation.confidence}%</strong></span>
              <span>STRATEGIC IMPORTANCE: <strong className="text-hud-amber">{investigation.importance}%</strong></span>
            </div>
          </div>

          {/* Section: Verifiable Multi-source Evidence Chain */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-hud-emerald" />
              VERIFIABLE EVIDENCE CHAIN (ANAKIN SEARCH & REGISTRIES)
            </h3>
            <div className="space-y-3">
              {investigation.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-slate-200 font-mono flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-hud-cyan" />
                      {item.source_title}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-hud-emerald/10 text-hud-emerald border border-hud-emerald/20">
                        {item.confidence}% CONFIDENCE
                      </span>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-hud-cyan hover:underline flex items-center gap-0.5"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-slate-300 font-medium mb-1">{item.claim}</p>
                  {item.quote && (
                    <blockquote className="pl-2 border-l-2 border-slate-700 text-slate-400 italic">
                      "{item.quote}"
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Likely Implications & Unknowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-hud-amber font-bold mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                LIKELY IMPLICATIONS
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {investigation.implications.map((imp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-hud-amber">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                REMAINING UNKNOWNS
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {investigation.unknowns.map((unk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-600">•</span>
                    <span>{unk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            CORTEX REASONING COMPLETE • AUDIT TRAIL LOGGED
          </span>
          {onProceedToOracle && (
            <button
              onClick={onProceedToOracle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-hud-violet/20 hover:bg-hud-violet/30 border border-hud-violet/50 text-hud-violet text-xs font-mono font-bold transition-all"
            >
              PROCEED TO ORACLE FORECAST <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
