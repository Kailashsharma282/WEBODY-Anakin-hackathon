"use client";

import React, { useState, useMemo } from "react";
import { GraphNode, GraphEdge } from "../lib/types";
import {
  ShieldAlert,
  Building2,
  Cpu,
  Globe2,
  FileCheck,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface WorldGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode) => void;
  selectedNodeId?: string;
  isDemoActive?: boolean;
}

const CANONICAL_FALLBACK_NODES: GraphNode[] = [
  { id: "node-anthropic", name: "Anthropic", label: "Anthropic", type: "company", importance: 100, status: "active", domain: "anthropic.com", description: "Our primary business: Claude frontier reasoning models and Enterprise AI platform." },
  { id: "node-openai", name: "OpenAI", label: "OpenAI", type: "competitor", importance: 95, status: "active", domain: "openai.com", description: "Primary competitor operating ChatGPT Enterprise and GPT-4o/o1 reasoning frontier." },
  { id: "node-deepmind", name: "Google DeepMind", label: "Google DeepMind", type: "competitor", importance: 92, status: "active", domain: "deepmind.google", description: "Frontier research lab deploying Gemini 2.0 multi-modal models." },
  { id: "node-aws", name: "AWS Bedrock", label: "AWS Bedrock", type: "vendor", importance: 90, status: "active", domain: "aws.amazon.com", description: "Primary cloud distribution and high-performance compute partner." },
  { id: "node-mistral", name: "Mistral AI", label: "Mistral AI", type: "competitor", importance: 82, status: "active", domain: "mistral.ai", description: "European frontier model provider with open-weight enterprise models." },
  { id: "node-eu-reg", name: "EU AI Office", label: "EU AI Office", type: "regulator", importance: 88, status: "active", domain: "digital-strategy.ec.europa.eu", description: "Article 52/53 General Purpose AI governance enforcement body." },
  { id: "node-enterprise", name: "Enterprise Market", label: "Enterprise Market", type: "marketplace", importance: 86, status: "active", domain: "enterprise.market", description: "Target Fortune 500 and Global 2000 AI procurement pipeline." },
];

const CANONICAL_FALLBACK_EDGES: GraphEdge[] = [
  { id: "edge-1", source: "node-openai", target: "node-anthropic", type: "competes_with", confidence: 98, current_value: "Frontier Enterprise Competition" },
  { id: "edge-2", source: "node-anthropic", target: "node-aws", type: "depends_on", confidence: 95, current_value: "Cloud Infrastructure & Bedrock APIs" },
  { id: "edge-3", source: "node-anthropic", target: "node-eu-reg", type: "targets", confidence: 90, current_value: "EU AI Act Compliance" },
  { id: "edge-4", source: "node-deepmind", target: "node-openai", type: "competes_with", confidence: 94, current_value: "Frontier Reasoning Race" },
  { id: "edge-5", source: "node-anthropic", target: "node-enterprise", type: "sells", confidence: 96, current_value: "Claude Enterprise ARR" },
  { id: "edge-6", source: "node-openai", target: "node-enterprise", type: "targets", confidence: 92, current_value: "Enterprise Accounts Defense" },
  { id: "edge-7", source: "node-mistral", target: "node-anthropic", type: "competes_with", confidence: 85, current_value: "European Market Share" },
];

export const WorldGraph: React.FC<WorldGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId,
  isDemoActive = false,
}) => {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const effectiveNodes = useMemo(() => {
    return nodes && nodes.length >= 2 ? nodes : CANONICAL_FALLBACK_NODES;
  }, [nodes]);

  const effectiveEdges = useMemo(() => {
    return edges && edges.length >= 2 ? edges : CANONICAL_FALLBACK_EDGES;
  }, [edges]);

  const getNodeDisplayName = (node?: GraphNode) => node?.name || node?.label || "Entity";

  // Center node is Anthropic (primary monitored entity)
  const centerNode = useMemo(() => {
    return (
      effectiveNodes.find((n) => {
        const d = getNodeDisplayName(n).toLowerCase();
        return d.includes("anthropic") || d.includes("company") || n.type === "company";
      }) || effectiveNodes[0]
    );
  }, [effectiveNodes]);

  const otherNodes = useMemo(() => {
    return effectiveNodes.filter((n) => n.id !== centerNode?.id);
  }, [effectiveNodes, centerNode]);

  // Compute radial layout positions in 800x520 canvas
  const centerX = 400;
  const centerY = 260;
  const radius = 190;

  const nodePositions = useMemo(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    if (centerNode) {
      posMap[centerNode.id] = { x: centerX, y: centerY };
    }

    const count = otherNodes.length;
    otherNodes.forEach((node, idx) => {
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      posMap[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return posMap;
  }, [centerNode, otherNodes, centerX, centerY, radius]);

  const getNodeIcon = (type: string, name: string) => {
    const t = type.toLowerCase();
    const n = name.toLowerCase();
    if (n.includes("anthropic") || n.includes("company")) return Sparkles;
    if (t === "competitor" || n.includes("competitor")) return ShieldAlert;
    if (t === "technology" || n.includes("aws")) return Cpu;
    if (t === "regulator" || n.includes("regulat")) return FileCheck;
    if (t === "marketplace") return Layers;
    if (t === "vendor") return Briefcase;
    return Globe2;
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.id === centerNode?.id) return "hud-cyan";
    const name = getNodeDisplayName(node);
    if (node.type === "competitor" || name.includes("Competitor")) return "hud-rose";
    if (node.type === "regulator") return "hud-amber";
    if (node.type === "technology" || node.type === "vendor") return "hud-violet";
    return "hud-emerald";
  };

  return (
    <div className="relative w-full h-[540px] glass-panel rounded-xl overflow-hidden border border-surface-border radar-grid">
      {/* Radar Sonar Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="radar-sweep" />
      </div>

      {/* HUD Header overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-hud-cyan animate-ping" />
          <span className="text-slate-300 font-bold">LIVING WORLD MODEL GRAPH</span>
        </div>
        {isDemoActive && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-hud-rose/10 border border-hud-rose/40 text-[11px] font-mono text-hud-rose animate-pulse">
            <span>RELATIONSHIP EVOLUTION DETECTED</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
        INTERACTIVE RADAR HUD • {effectiveNodes.length} NODES ONLINE
      </div>

      {/* SVG Canvas */}
      <svg className="w-full h-full" viewBox="0 0 800 520">
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </radialGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbit Background Rings */}
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#1f293d" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={centerX} cy={centerY} r={radius * 0.55} fill="none" stroke="#141b2d" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius + 45} fill="none" stroke="#0f172a" strokeWidth="1" strokeDasharray="2 6" />

        {/* Center Glow */}
        <circle cx={centerX} cy={centerY} r="90" fill="url(#centerGlow)" />

        {/* Edges */}
        {effectiveEdges.map((edge) => {
          const srcPos = nodePositions[edge.source];
          const tgtPos = nodePositions[edge.target];
          if (!srcPos || !tgtPos) return null;

          const relType = edge.relationship || edge.type || "";
          const isWarEdge =
            edge.current_value?.toLowerCase().includes("war") ||
            relType === "competes_with";

          return (
            <g key={edge.id}>
              <line
                x1={srcPos.x}
                y1={srcPos.y}
                x2={tgtPos.x}
                y2={tgtPos.y}
                stroke={isWarEdge ? "#f43f5e" : "#00f0ff"}
                strokeOpacity={isWarEdge ? 0.7 : 0.25}
                strokeWidth={isWarEdge ? 2 : 1}
                strokeDasharray={isWarEdge ? "6 3" : undefined}
                className={isWarEdge ? "animate-pulse" : ""}
              />
              {/* Animated data packet traveling on edge */}
              <circle r={isWarEdge ? 3 : 2} fill={isWarEdge ? "#f43f5e" : "#00f0ff"}>
                <animateMotion
                  path={`M ${srcPos.x} ${srcPos.y} L ${tgtPos.x} ${tgtPos.y}`}
                  dur={isWarEdge ? "2s" : "4s"}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Edge relationship label */}
              <text
                x={(srcPos.x + tgtPos.x) / 2}
                y={(srcPos.y + tgtPos.y) / 2 - 6}
                fill={isWarEdge ? "#fda4af" : "#64748b"}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {relType.replace("_", " ")}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {effectiveNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const isCenter = node.id === centerNode?.id;
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const nodeName = getNodeDisplayName(node);
          const Icon = getNodeIcon(node.type, nodeName);
          const colorClass = getNodeColor(node);

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-transform duration-200"
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Pulsing ring for selected/center node */}
              {(isCenter || isSelected) && (
                <circle
                  r={isCenter ? 36 : 28}
                  fill="none"
                  stroke={isCenter ? "#00f0ff" : "#8b5cf6"}
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="animate-spin"
                  style={{ animationDuration: "12s" }}
                />
              )}

              {/* Node Outer Circle */}
              <circle
                r={isCenter ? 28 : 20}
                fill="#0c101d"
                stroke={
                  isSelected
                    ? "#00f0ff"
                    : isCenter
                    ? "#00f0ff"
                    : colorClass === "hud-rose"
                    ? "#f43f5e"
                    : colorClass === "hud-amber"
                    ? "#f59e0b"
                    : "#334155"
                }
                strokeWidth={isSelected || isCenter ? 2.5 : 1.5}
                filter="url(#glowFilter)"
              />

              {/* Node Icon */}
              <foreignObject
                x={isCenter ? -12 : -9}
                y={isCenter ? -12 : -9}
                width={isCenter ? 24 : 18}
                height={isCenter ? 24 : 18}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Icon
                    className={`w-full h-full ${
                      isCenter
                        ? "text-hud-cyan"
                        : colorClass === "hud-rose"
                        ? "text-hud-rose"
                        : colorClass === "hud-amber"
                        ? "text-hud-amber"
                        : "text-slate-300"
                    }`}
                  />
                </div>
              </foreignObject>

              {/* Node Name Label */}
              <text
                y={isCenter ? 44 : 32}
                fill={isSelected ? "#00f0ff" : "#f1f5f9"}
                fontSize={isCenter ? 12 : 11}
                fontWeight={isCenter ? "bold" : "normal"}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {nodeName}
              </text>

              {/* Node Category / Status Subtitle */}
              <text
                y={isCenter ? 56 : 43}
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {node.type.toUpperCase()} • {node.importance}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Info Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-lg border border-slate-700 text-xs font-mono max-w-sm pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-100">{getNodeDisplayName(hoveredNode)}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
              {hoveredNode.type}
            </span>
          </div>
          <p className="mt-1 text-slate-400 line-clamp-2">
            {hoveredNode.description || `Active world model entity with ${hoveredNode.importance}% importance score.`}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>DOMAIN: {hoveredNode.domain || "N/A"}</span>
            <span className="text-hud-cyan">CLICK TO INSPECT PROFILE →</span>
          </div>
        </div>
      )}
    </div>
  );
};
