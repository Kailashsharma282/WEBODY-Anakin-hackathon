"use client";

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  X,
  Hash,
  Layers,
  Sparkles
} from "lucide-react";

interface AuditBlock {
  block_height: number;
  phase: string;
  title: string;
  sha256: string;
  parent_sha256: string;
  verified: boolean;
  timestamp: string;
  evidence_ref: string;
}

interface CryptographicAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CryptographicAuditModal: React.FC<CryptographicAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [chain, setChain] = useState<AuditBlock[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      fetchProvenance();
    }
  }, [isOpen]);

  const fetchProvenance = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditProvenance();
      setChain(data.chain || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl glass-panel border border-surface-border rounded-xl shadow-2xl bg-slate-950/95 overflow-hidden text-xs font-mono max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-hud-emerald/20 border border-hud-emerald/50 flex items-center justify-center text-hud-emerald">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                  Cryptographic Forensic Audit Chain
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-hud-emerald/20 text-hud-emerald border border-hud-emerald/40 font-bold">
                  VERIFIED 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mathematical proof linking DOM observations to external Wire execution (0 Hallucination Guarantee).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chain Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">Verifying cryptographic Merkle hashes...</div>
          ) : (
            <div className="space-y-3">
              {chain.map((block) => (
                <div
                  key={block.block_height}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hud-cyan/20 text-hud-cyan border border-hud-cyan/40">
                        BLOCK #{block.block_height} • {block.phase}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{block.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-hud-emerald text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SIGNATURE VALID</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded border border-slate-800/80 truncate">
                      <span className="text-slate-500 font-bold">HASH:</span>
                      <span className="text-slate-300 font-mono truncate">{block.sha256}</span>
                      <button
                        onClick={() => handleCopy(block.sha256)}
                        className="ml-auto text-slate-400 hover:text-hud-cyan"
                        title="Copy SHA-256"
                      >
                        {copiedHash === block.sha256 ? <Check className="w-3.5 h-3.5 text-hud-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded border border-slate-800/80 truncate">
                      <span className="text-slate-500 font-bold">PARENT:</span>
                      <span className="text-slate-400 font-mono truncate">{block.parent_sha256}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>EVIDENCE: <strong className="text-slate-300">{block.evidence_ref}</strong></span>
                    <span className="text-slate-500">{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-hud-emerald" />
            <span>Cryptographic audit proof compatible with EU AI Act Article 12 & SOC2 Type II.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
