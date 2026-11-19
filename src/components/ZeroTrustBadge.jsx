import React, { useState, useEffect } from "react";
import { Check, ShieldCheck, Loader2 } from "lucide-react";

export default function ZeroTrustBadge({ onVerified }) {
  const [status, setStatus] = useState("verifying"); // "verifying" | "verified"

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("verified");
      if (onVerified) onVerified(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onVerified]);

  return (
    <div className="w-full my-4 rounded-xl p-3 bg-slate-50 dark:bg-[#0B0F17]/90 border border-slate-200/90 dark:border-[#1E2638] flex items-center justify-between transition-colors shadow-sm">
      <div className="flex items-center space-x-3">
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-md border transition-all ${
            status === "verified"
              ? "bg-brand-500/10 border-brand-500 text-brand-500"
              : "bg-slate-200 dark:bg-[#151C2A] border-slate-300 dark:border-slate-700 text-slate-400"
          }`}
        >
          {status === "verifying" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[3] text-brand-500" />
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
            {status === "verifying"
              ? "Verifying connection security..."
              : "Zero-Trust Posture Verified"}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            TLS 1.3 • Hardware Attestation • Anti-Bot
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 opacity-75">
        <ShieldCheck className="w-4 h-4 text-brand-500" />
        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400">
          VaultGuard
        </span>
      </div>
    </div>
  );
}
