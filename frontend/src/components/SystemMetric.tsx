"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface SystemMetricProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color?: "cyan" | "violet" | "emerald" | "amber" | "rose";
}

export const SystemMetric: React.FC<SystemMetricProps> = ({
  label,
  value,
  change,
  trend = "up",
  icon: Icon,
  color = "cyan",
}) => {
  const colorMap = {
    cyan: "text-hud-cyan border-hud-cyan/20 bg-hud-cyan/5",
    violet: "text-hud-violet border-hud-violet/20 bg-hud-violet/5",
    emerald: "text-hud-emerald border-hud-emerald/20 bg-hud-emerald/5",
    amber: "text-hud-amber border-hud-amber/20 bg-hud-amber/5",
    rose: "text-hud-rose border-hud-rose/20 bg-hud-rose/5",
  };

  const glowMap = {
    cyan: "neon-glow-cyan",
    violet: "neon-glow-violet",
    emerald: "neon-glow-emerald",
    amber: "neon-glow-amber",
    rose: "neon-glow-rose",
  };

  return (
    <div className="glass-panel p-4 rounded-lg relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded border ${colorMap[color]} ${glowMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs font-mono font-medium ${
              trend === "up"
                ? "text-hud-emerald"
                : trend === "down"
                ? "text-hud-rose"
                : "text-slate-400"
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-2 h-0.5 w-full bg-slate-800 overflow-hidden rounded">
        <div
          className={`h-full ${
            color === "cyan"
              ? "bg-hud-cyan"
              : color === "violet"
              ? "bg-hud-violet"
              : color === "emerald"
              ? "bg-hud-emerald"
              : color === "amber"
              ? "bg-hud-amber"
              : "bg-hud-rose"
          }`}
          style={{ width: "70%" }}
        />
      </div>
    </div>
  );
};
