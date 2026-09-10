"use client";

import React, { useState } from "react";
import { 
  X, Split, ArrowRight, ShieldAlert, Check, Copy, 
  ExternalLink, SlidersHorizontal, RefreshCw, Zap, TrendingDown 
} from "lucide-react";

interface DiffLine {
  type: "ctx" | "del" | "add";
  leftNum?: number;
  rightNum?: number;
  leftText?: string;
  rightText?: string;
}

interface DiffCase {
  id: string;
  target: string;
  url: string;
  detectedAt: string;
  category: string;
  severity: "critical" | "high" | "medium";
  deltaSummary: string;
  lines: DiffLine[];
}

const SAMPLE_DIFFS: DiffCase[] = [
  {
    id: "diff-comp-x",
    target: "Competitor X Enterprise Pricing",
    url: "https://competitor-x.ai/pricing",
    detectedAt: "10 mins ago (via Sentinel Scraper)",
    category: "PRICING & PACKAGING",
    severity: "critical",
    deltaSummary: "-22% Price Slash & Free AI Governance Bundling",
    lines: [
      { type: "ctx", leftNum: 14, rightNum: 14, leftText: "### Tier Comparison Matrix", rightText: "### Tier Comparison Matrix" },
      { type: "ctx", leftNum: 15, rightNum: 15, leftText: "#### Team Plan: $49/seat/mo", rightText: "#### Team Plan: $49/seat/mo" },
      { type: "del", leftNum: 16, rightNum: undefined, leftText: "- Enterprise Base: $10,000 / month (annual commit)", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 16, leftText: "", rightText: "+ Enterprise Base: $7,800 / month (annual commit) [-22% PRICE DROP]" },
      { type: "del", leftNum: 17, rightNum: undefined, leftText: "- Enterprise AI Governance Addon: $2,500 / month", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 17, leftText: "", rightText: "+ Enterprise AI Governance Suite: INCLUDED FREE FOR ALL ANNUAL DEALS" },
      { type: "ctx", leftNum: 18, rightNum: 18, leftText: "- Dedicated VPC Deployment: Yes", rightText: "- Dedicated VPC Deployment: Yes" },
      { type: "del", leftNum: 19, rightNum: undefined, leftText: "- SLA Guarantee: 99.9% uptime credit", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 19, leftText: "", rightText: "+ SLA Guarantee: 99.99% high-availability active-active failover" },
      { type: "ctx", leftNum: 20, rightNum: 20, leftText: "- Support: 24/7 Dedicated Slack Channel", rightText: "- Support: 24/7 Dedicated Slack Channel" }
    ]
  },
  {
    id: "diff-aws-bedrock",
    target: "AWS Bedrock Foundation Models",
    url: "https://aws.amazon.com/bedrock/pricing",
    detectedAt: "2 hours ago (via Web Monitoring)",
    category: "CLOUD INFRASTRUCTURE",
    severity: "high",
    deltaSummary: "Batch Inference API Rate Reductions (-50%)",
    lines: [
      { type: "ctx", leftNum: 42, rightNum: 42, leftText: "### On-Demand vs Batch API Pricing", rightText: "### On-Demand vs Batch API Pricing" },
      { type: "del", leftNum: 43, rightNum: undefined, leftText: "Standard Tier Input: $3.00 / 1M tokens", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 43, leftText: "", rightText: "Standard Tier Input: $2.40 / 1M tokens (-20% discount)" },
      { type: "del", leftNum: 44, rightNum: undefined, leftText: "Batch Inference (24hr window): 25% discount off standard", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 44, leftText: "", rightText: "Batch Inference (24hr window): 50% discount off standard [NEW]" },
      { type: "ctx", leftNum: 45, rightNum: 45, leftText: "Region availability: us-east-1, us-west-2, eu-central-1", rightText: "Region availability: us-east-1, us-west-2, eu-central-1" }
    ]
  },
  {
    id: "diff-eu-act",
    target: "EU AI Office Regulatory Gazette",
    url: "https://digital-strategy.ec.europa.eu/ai-act",
    detectedAt: "4 hours ago (via Sentinel Wire)",
    category: "REGULATORY COMPLIANCE",
    severity: "critical",
    deltaSummary: "Article 43 Conformity Audit Deadline Enacted",
    lines: [
      { type: "ctx", leftNum: 88, rightNum: 88, leftText: "Section 4: Obligations on General-Purpose AI Systems", rightText: "Section 4: Obligations on General-Purpose AI Systems" },
      { type: "del", leftNum: 89, rightNum: undefined, leftText: "Providers shall participate in voluntary code of practice drafting until Q4.", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 89, leftText: "", rightText: "Providers shall submit mandatory systemic risk conformity documentation by Q3." },
      { type: "del", leftNum: 90, rightNum: undefined, leftText: "Audit logs storage recommendation: 6 months minimum.", rightText: "" },
      { type: "add", leftNum: undefined, rightNum: 90, leftText: "", rightText: "Audit logs storage requirement: 24 months immutable retention mandatory." },
      { type: "ctx", leftNum: 91, rightNum: 91, leftText: "Non-compliance penalty: Up to €35M or 7% global annual turnover.", rightText: "Non-compliance penalty: Up to €35M or 7% global annual turnover." }
    ]
  }
];

interface SentinelDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate?: () => void;
}

export function SentinelDiffModal({ isOpen, onClose, onSimulate }: SentinelDiffModalProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("diff-comp-x");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCase = SAMPLE_DIFFS.find(c => c.id === selectedCaseId) || SAMPLE_DIFFS[0];

  const handleCopySummary = () => {
    const text = `SENTINEL CHANGE DIFF REPORT:
Target: ${currentCase.target} (${currentCase.url})
Detected: ${currentCase.detectedAt}
Delta Summary: ${currentCase.deltaSummary}
Severity: ${currentCase.severity.toUpperCase()}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl glass-panel holo-border rounded-2xl p-6 shadow-2xl border border-hud-cyan/40 bg-slate-950/95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/30 neon-glow-cyan">
              <Split className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-bold text-slate-100 uppercase tracking-wide">
                  SENTINEL VISUAL SIDE-BY-SIDE CHANGE DIFF
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-rose/20 text-hud-rose border border-hud-rose/40">
                  {currentCase.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Precision DOM & pricing difference tracker powered by Anakin Scraper & Monitor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Switcher Tabs */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
          {SAMPLE_DIFFS.map(c => {
            const isSel = c.id === currentCase.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSel
                    ? "bg-hud-cyan text-slate-950 font-bold border-hud-cyan shadow-sm shadow-hud-cyan/25"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span>{c.target}</span>
                <span className={`w-2 h-2 rounded-full ${c.severity === "critical" ? "bg-hud-rose" : "bg-hud-amber"}`} />
              </button>
            );
          })}
        </div>

        {/* Meta Bar */}
        <div className="py-3 px-4 my-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 block text-[10px]">URL SOURCE</span>
              <a 
                href={currentCase.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-hud-cyan hover:underline flex items-center gap-1 font-bold"
              >
                {currentCase.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
              <span className="text-slate-300">{currentCase.detectedAt}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DELTA VERDICT</span>
              <span className="text-hud-rose font-bold">{currentCase.deltaSummary}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-slate-100 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-hud-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "COPIED" : "COPY DIFF"}</span>
            </button>
            {onSimulate && (
              <button
                onClick={() => {
                  onClose();
                  onSimulate();
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-hud-cyan to-teal-400 text-slate-950 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-hud-cyan/20 hover:opacity-95 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>COUNTER-SIMULATE</span>
              </button>
            )}
          </div>
        </div>

        {/* Diff Columns Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono font-bold pb-2 border-b border-slate-800 text-slate-400">
          <div className="flex items-center justify-between px-3 text-hud-rose">
            <span>PREVIOUS REVISION (SNAPSHOT V1)</span>
            <span className="text-[10px] text-slate-500">BASELINE</span>
          </div>
          <div className="flex items-center justify-between px-3 text-hud-emerald">
            <span>OBSERVED REVISION (ANAKIN SCRAPER V2)</span>
            <span className="text-[10px] text-slate-500">LIVE DELTA</span>
          </div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto space-y-1 my-2 max-h-[460px] font-mono text-xs">
          {currentCase.lines.map((line, idx) => {
            const isDel = line.type === "del";
            const isAdd = line.type === "add";
            const isCtx = line.type === "ctx";

            return (
              <div 
                key={idx} 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1.5 px-3 rounded text-[11px] transition-colors hover:bg-slate-900/40"
              >
                {/* Left Side (Previous / Baseline) */}
                <div className={`flex items-start gap-2.5 ${isDel ? "diff-del-row px-2 py-1 rounded" : isCtx ? "text-slate-400" : "opacity-30"}`}>
                  <span className="w-6 text-right text-slate-600 select-none">
                    {line.leftNum || " "}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">
                    {line.leftText || (isAdd ? " " : "")}
                  </span>
                </div>

                {/* Right Side (Current / Observed) */}
                <div className={`flex items-start gap-2.5 ${isAdd ? "diff-add-row px-2 py-1 rounded" : isCtx ? "text-slate-300" : "opacity-30"}`}>
                  <span className="w-6 text-right text-slate-600 select-none">
                    {line.rightNum || " "}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words font-medium">
                    {line.rightText || (isDel ? " " : "")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-hud-emerald">
              <span className="w-2 h-2 rounded-full bg-hud-emerald inline-block" />
              2 Additions
            </span>
            <span className="flex items-center gap-1 text-hud-rose">
              <span className="w-2 h-2 rounded-full bg-hud-rose inline-block" />
              2 Deletions
            </span>
            <span className="text-slate-500">
              Integrity: Verified by SHA-256 DOM Snapshot Hash
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
