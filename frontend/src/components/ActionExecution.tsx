"use client";

import React from "react";
import { Action } from "../lib/types";
import {
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  X
} from "lucide-react";

interface ActionExecutionProps {
  action: Action | null;
  onClose: () => void;
}

export const ActionExecution: React.FC<ActionExecutionProps> = ({
  action,
  onClose,
}) => {
  if (!action) return null;

  const steps = [
    { id: "discovered", label: "ACTION DISCOVERED" },
    { id: "validated", label: "ACTION VALIDATED" },
    { id: "submitted", label: "ACTION SUBMITTED" },
    { id: "running", label: "ACTION RUNNING" },
    { id: "completed", label: "ACTION COMPLETED" },
  ];

  const getStepStatus = (stepId: string) => {
    const statusOrder = ["discovered", "validated", "submitted", "running", "completed"];
    const currentIdx = statusOrder.indexOf(action.status);
    const stepIdx = statusOrder.indexOf(stepId);

    if (action.status === "failed") {
      if (stepIdx < currentIdx) return "done";
      if (stepIdx === currentIdx) return "error";
      return "pending";
    }

    if (stepIdx <= currentIdx) return "done";
    return "pending";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-hud-cyan/50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-hud-cyan/15 text-hud-cyan border border-hud-cyan/40 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                HANDS ENGINE • ANAKIN WIRE
              </span>
              <span className="text-xs font-mono text-slate-400">
                ACTION ID: <strong className="text-slate-200">{action.action_id}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-2 font-mono">
              {action.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The 5 Lifecycle Steps Required By Section 10 */}
        <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase mb-4 tracking-wider">
            WIRE EXECUTION LIFECYCLE MONITOR:
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex sm:flex-col items-center gap-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-all duration-300 ${
                      status === "done"
                        ? "bg-hud-emerald/20 border-hud-emerald text-hud-emerald shadow-md shadow-hud-emerald/20"
                        : status === "error"
                        ? "bg-hud-rose/20 border-hud-rose text-hud-rose"
                        : "bg-slate-900 border-slate-700 text-slate-500"
                    }`}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : status === "error" ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono text-center max-w-[90px] leading-tight ${
                      status === "done"
                        ? "text-slate-200 font-bold"
                        : status === "error"
                        ? "text-hud-rose font-bold"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Details */}
        <div className="space-y-3 text-xs font-mono mb-6">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">DISPATCH STATUS:</span>
              <span
                className={`font-bold uppercase ${
                  action.status === "completed"
                    ? "text-hud-emerald"
                    : action.status === "failed"
                    ? "text-hud-rose"
                    : "text-hud-cyan"
                }`}
              >
                {action.status}
              </span>
            </div>
            {action.external_id && (
              <div className="flex justify-between">
                <span className="text-slate-400">ANAKIN WIRE TRANSACTION ID:</span>
                <span className="text-slate-200">{action.external_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">TIMESTAMP:</span>
              <span className="text-slate-200">{new Date(action.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Payload Preview */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 max-h-40 overflow-y-auto">
            <div className="text-[10px] text-slate-500 uppercase mb-1">
              PAYLOAD EXECUTED ON TARGET:
            </div>
            <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
              {JSON.stringify(action.payload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-hud-emerald flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            CONFIRMED BY EXTERNAL WIRE EXECUTION LAYER
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
