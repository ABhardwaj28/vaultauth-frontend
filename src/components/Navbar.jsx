import React, { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Radio } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { api } from "../services/api";

export default function Navbar({ user, onLogout }) {
  const [health, setHealth] = useState({
    checking: true,
    online: false,
    latency: null,
  });

  const runHealthCheck = async () => {
    setHealth((prev) => ({ ...prev, checking: true }));
    const res = await api.checkHealth();
    setHealth({
      checking: false,
      online: res.ok,
      latency: res.latency,
    });
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-[#1A2232] bg-white/80 dark:bg-[#0A0D14]/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#FB923C]/20 via-[#F6821F]/15 to-transparent border border-brand-500/30">
            <ShieldCheck className="w-5 h-5 text-brand-500 drop-shadow-[0_0_8px_rgba(246,130,31,0.5)]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white text-base">
              VaultAuth
            </span>
            <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              SSO v2.0
            </span>
          </div>
        </div>

        {/* Center / Right Control Hub */}
        <div className="flex items-center space-x-3">
          {/* Live Backend Telemetry Pill */}
          <div
            className={`hidden sm:inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              health.checking
                ? "bg-slate-100 dark:bg-[#141B28] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                : health.online
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {health.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  health.checking
                    ? "bg-amber-400 animate-pulse"
                    : health.online
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              ></span>
            </span>
            <span>
              {health.checking
                ? "Checking API..."
                : health.online
                ? `API Online (${health.latency}ms)`
                : "API Offline"}
            </span>
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={health.checking}
              className="hover:opacity-75 focus:outline-none ml-0.5"
              title="Ping Backend API"
            >
              <RefreshCw
                className={`w-3 h-3 ${health.checking ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* User Status / Theme Switcher */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {user.email}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                  user.role === "admin"
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {user.role}
              </span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
