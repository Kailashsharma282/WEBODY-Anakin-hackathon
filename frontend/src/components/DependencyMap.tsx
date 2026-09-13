"use client";

import React, { useState } from "react";
import {
  Layers,
  Search,
  ExternalLink,
  Shield,
  Tag,
  Globe2,
  FolderTree,
  FileCode,
  Sparkles
} from "lucide-react";

interface DependencyMapProps {
  domainTopology?: any;
  onMapDomain: (domain: string) => void;
  isLoading?: boolean;
}

export const DependencyMap: React.FC<DependencyMapProps> = ({
  domainTopology,
  onMapDomain,
  isLoading = false,
}) => {
  const [domainInput, setDomainInput] = useState("openai.com");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domainInput.trim()) {
      onMapDomain(domainInput.trim());
    }
  };

  const categories = [
    "ALL",
    "PRICING",
    "PRODUCT",
    "DOCUMENTATION",
    "SECURITY",
    "CAREERS",
    "BLOG",
    "PRESS",
    "CUSTOMERS",
    "INTEGRATIONS",
    "LEGAL",
    "OTHER"
  ];

  const pages = domainTopology?.pages || [
    {
      url: "https://openai.com/api/pricing",
      page_category: "PRICING",
      title: "OpenAI API Pricing & Token Tiers",
      importance: 95,
      summary: "Tiered pricing table for GPT-4o, o1, and embeddings models.",
      status: "mapped",
    },
    {
      url: "https://platform.openai.com/docs",
      page_category: "DOCUMENTATION",
      title: "OpenAI Platform Developer API Documentation",
      importance: 92,
      summary: "API reference detailing structured outputs, tools, and batch inference.",
      status: "mapped",
    },
    {
      url: "https://trust.openai.com",
      page_category: "SECURITY",
      title: "OpenAI Trust Portal & SOC2 Compliance",
      importance: 90,
      summary: "SOC2 Type II, HIPAA readiness, and GDPR compliance attestations.",
      status: "mapped",
    },
    {
      url: "https://openai.com/enterprise",
      page_category: "CUSTOMERS",
      title: "ChatGPT Enterprise & Governance Controls",
      importance: 88,
      summary: "Dedicated workspace admin console and privacy commitments.",
      status: "mapped",
    },
    {
      url: "https://openai.com/index/category/announcements/",
      page_category: "BLOG",
      title: "OpenAI News & Frontier Research Announcements",
      importance: 85,
      summary: "Product updates, system cards, and release notifications.",
      status: "mapped",
    },
    {
      url: "https://openai.com/careers",
      page_category: "CAREERS",
      title: "OpenAI Engineering & Alignment Careers",
      importance: 75,
      summary: "Talent acquisition listings indicating scaling frontiers.",
      status: "mapped",
    },
  ];

  const filteredPages = pages.filter((p: any) => {
    if (selectedCategory === "ALL") return true;
    return p.page_category.toUpperCase() === selectedCategory;
  });

  return (
    <div className="glass-panel p-6 rounded-xl border border-surface-border">
      {/* Search / Scan Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40 flex items-center gap-1">
              <FolderTree className="w-3 h-3" />
              CARTOGRAPHER ENGINE
            </span>
            {domainTopology?.live_anakin_used && (
              <span className="text-[10px] font-mono text-hud-emerald border border-hud-emerald/30 px-2 py-0.5 rounded bg-hud-emerald/10">
                LIVE ANAKIN MAP API ACTIVE
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-100 font-mono mt-1">
            Semantic Domain Topology & Page Classification
          </h3>
        </div>

        {/* Domain Scanner Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. openai.com"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-hud-cyan"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-hud-cyan text-slate-950 rounded-lg text-xs font-mono font-bold hover:bg-hud-cyan/90 transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-hud-cyan/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoading ? "SCANNING..." : "SCAN DOMAIN"}
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-slate-800/80 text-xs font-mono no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-md uppercase text-[11px] whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-hud-cyan text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pages Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page: any, idx: number) => {
          const categoryColors: Record<string, string> = {
            PRICING: "text-hud-rose border-hud-rose/30 bg-hud-rose/10",
            DOCUMENTATION: "text-hud-cyan border-hud-cyan/30 bg-hud-cyan/10",
            SECURITY: "text-hud-emerald border-hud-emerald/30 bg-hud-emerald/10",
            CAREERS: "text-hud-amber border-hud-amber/30 bg-hud-amber/10",
            PRODUCT: "text-hud-violet border-hud-violet/30 bg-hud-violet/10",
            BLOG: "text-slate-300 border-slate-700 bg-slate-800/60",
          };

          return (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      categoryColors[page.page_category.toUpperCase()] ||
                      "text-slate-400 border-slate-800 bg-slate-900"
                    }`}
                  >
                    {page.page_category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    IMPORTANCE: <strong className="text-slate-300">{page.importance}%</strong>
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 font-sans mb-1.5 hover:text-hud-cyan">
                  {page.title}
                </h4>

                <p className="text-xs text-slate-400 font-sans line-clamp-2 mb-3">
                  {page.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="truncate max-w-[180px]">{page.url}</span>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hud-cyan hover:underline flex items-center gap-1"
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
