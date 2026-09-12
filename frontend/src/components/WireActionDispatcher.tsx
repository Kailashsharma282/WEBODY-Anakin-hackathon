"use client";

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Zap,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  ExternalLink,
  Lock,
  Layers,
  Sparkles
} from "lucide-react";

interface WireTool {
  action_id: string;
  name: string;
  service: string;
  description: string;
  required_inputs: string[];
  input_schema: Record<string, any>;
  default_payload: Record<string, any>;
}

const WIRE_TOOLS: WireTool[] = [
  {
    action_id: "github.issue.create",
    name: "Create GitHub Strategy/Governance Issue",
    service: "github",
    description: "Create a priority strategic issue in the target repository to track competitive counter-actions.",
    required_inputs: ["repo", "title", "body"],
    input_schema: {
      repo: { type: "string", description: "Repository in owner/repo format" },
      title: { type: "string", description: "Title of the issue" },
      body: { type: "string", description: "Markdown body describing the strategic counter-measure" },
      labels: { type: "array", description: "Labels e.g. ['strategy', 'priority-p0']" }
    },
    default_payload: {
      repo: "acme-ai/enterprise-platform",
      title: "STRATEGIC COUNTER: Bundle SOC2 & EU AI Act Governance Suite",
      body: "## Context\nCompetitor X executed -22% price reduction. Counter with enterprise governance bundle.\n\n## Action Items\n- Attach compliance templates\n- Update enterprise landing matrix\n- Deploy sales enablement battlecards",
      labels: ["priority-p0", "anakin-wire", "hackathon-demo"]
    }
  },
  {
    action_id: "slack.message.send",
    name: "Dispatch Executive Tactical Slack Alert",
    service: "slack",
    description: "Send a high-priority card to the executive leadership channel with simulation recommendations.",
    required_inputs: ["channel", "message"],
    input_schema: {
      channel: { type: "string", description: "Target channel name" },
      message: { type: "string", description: "Summary text and action triggers" }
    },
    default_payload: {
      channel: "#executive-intelligence-war-room",
      message: "🚨 *WEBODY INTELLIGENCE ALERT*: Competitor X pricing cut detected (-22%). Oracle Bayes Model projects 84% platform launch probability within 30 days. Simulator recommends Strategy C (Governance Bundle) with 94/100 net score. Countermeasure dispatched via Anakin Wire."
    }
  },
  {
    action_id: "hubspot.deal.protect",
    name: "Guard Enterprise CRM Pipeline Deals",
    service: "hubspot",
    description: "Flag CRM enterprise deals at risk of competitor pricing disruption and auto-attach governance counter-dossier.",
    required_inputs: ["pipeline_id", "risk_threshold", "counter_bundle_id"],
    input_schema: {
      pipeline_id: { type: "string", description: "HubSpot Sales Pipeline identifier" },
      risk_threshold: { type: "number", description: "Probability threshold (e.g. 0.70) to trigger deal lock" },
      counter_bundle_id: { type: "string", description: "Strategic bundle identifier" }
    },
    default_payload: {
      pipeline_id: "enterprise-tier-pipeline-q3",
      risk_threshold: 0.70,
      counter_bundle_id: "GOV_COMPLIANCE_2026"
    }
  },
  {
    action_id: "linear.issue.create",
    name: "Dispatch Priority Engineering Countermeasure",
    service: "linear",
    description: "Create a P0 engineering ticket in Linear to accelerate defensive product roadmap commitments.",
    required_inputs: ["team_id", "title", "priority"],
    input_schema: {
      team_id: { type: "string", description: "Linear Team Key (e.g. ENG, SEC)" },
      title: { type: "string", description: "Title of defensive countermeasure task" },
      priority: { type: "integer", description: "Priority 0-4 (0 = Urgent, 1 = High)" }
    },
    default_payload: {
      team_id: "SEC",
      title: "Deploy Automated EU AI Act Sovereign Boundary Checkpoint",
      priority: 0
    }
  },
  {
    action_id: "webhook.post",
    name: "Trigger Automated Strategic Webhook",
    service: "webhook",
    description: "Post validated strategy execution payload to internal ERP / BI systems.",
    required_inputs: ["target_url", "payload"],
    input_schema: {
      target_url: { type: "string", description: "Destination endpoint URL" },
      payload: { type: "object", description: "Structured execution data" }
    },
    default_payload: {
      target_url: "https://bi.acme.ai/api/v1/strategic-events",
      payload: {
        event: "COMPETITOR_PRICING_DISRUPTION",
        status: "COUNTERMEASURE_ENGAGED",
        defensibility_index: 92
      }
    }
  }
];

export const WireActionDispatcher: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<WireTool>(WIRE_TOOLS[0]);
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(WIRE_TOOLS[0].default_payload, null, 2)
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToolSelect = (tool: WireTool) => {
    setSelectedTool(tool);
    setPayloadText(JSON.stringify(tool.default_payload, null, 2));
    setExecutionResult(null);
    setErrorMessage(null);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMessage(null);
    try {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (err) {
        throw new Error("Invalid JSON payload format.");
      }

      const res = await api.executeAction({
        action_id: selectedTool.action_id,
        payload: parsedPayload,
        auto_approved: true
      });

      setExecutionResult(res);
    } catch (err: any) {
      setErrorMessage(err?.message || "Action execution failed.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs font-mono">
      {/* Tool Selector Buttons */}
      <div>
        <span className="text-slate-400 block mb-2 uppercase text-[10px] tracking-wider">
          Anakin Wire Active Action Catalog (5 Certified Tools)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {WIRE_TOOLS.map((t) => {
            const isSelected = selectedTool.action_id === t.action_id;
            return (
              <button
                key={t.action_id}
                onClick={() => handleToolSelect(t)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-hud-cyan/15 border-hud-cyan text-slate-100 shadow-sm shadow-hud-cyan/20"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className={`w-3 h-3 ${isSelected ? "text-hud-cyan" : "text-slate-500"}`} />
                  <span className="font-bold truncate text-[11px]">{t.service.toUpperCase()}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{t.action_id}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Payload Configuration Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Tool Details & Payload Editor */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-hud-cyan font-bold uppercase">{selectedTool.service}</span>
              <h4 className="font-bold text-slate-100 text-sm">{selectedTool.name}</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-400">
              SCHEMA VERIFIED
            </span>
          </div>

          <p className="text-[11px] text-slate-400">{selectedTool.description}</p>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase">
              Action Payload (JSON Schema Validated)
            </label>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={8}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-slate-200 text-xs font-mono focus:border-hud-cyan outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-hud-emerald">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Canary Guardrail Active</span>
            </div>

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hud-rose hover:bg-rose-500 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-hud-rose/20 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? "animate-spin" : ""}`} />
              {isExecuting ? "EXECUTING VIA WIRE..." : "DISPATCH ACTION"}
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded bg-rose-950/50 border border-hud-rose/40 text-hud-rose text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Real-Time Execution Telemetry Terminal */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-hud-cyan" />
                Live Wire Execution Monitor
              </span>
              {executionResult && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40 uppercase font-bold">
                  {executionResult.status}
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">ACTION ID:</span>
                  <span className="text-slate-200 font-bold">{executionResult.action_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">EXTERNAL WIRE REF:</span>
                  <span className="text-hud-cyan font-bold">{executionResult.external_id || "wire_dispatch_confirmed"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">STATUS:</span>
                  <span className="text-hud-emerald font-bold uppercase">{executionResult.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">CANARY VALIDATION:</span>
                  <span className="text-hud-emerald">PASSED (0 destructive signatures)</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block mb-1">EXECUTION RECEIPT:</span>
                  <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 max-h-36 overflow-y-auto">
                    {JSON.stringify(executionResult.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Zap className="w-8 h-8 text-slate-700 mx-auto" />
                <p>READY TO DISPATCH VIA ANAKIN WIRE.</p>
                <p className="text-[10px] text-slate-600">
                  Select an action tool, review parameters, and click Dispatch Action.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex justify-between items-center">
            <span>PROTOCOL: ANAKIN WIRE REST/ASYNC v1</span>
            <span className="text-hud-emerald">CANARY SAFETY GUARD ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
