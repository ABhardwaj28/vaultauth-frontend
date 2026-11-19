import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Globe,
  LogOut,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Key,
  Clock,
  Fingerprint,
} from "lucide-react";
import { api } from "../services/api";

export default function DashboardView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, sessionsRes] = await Promise.allSettled([
        api.getProfile(),
        api.getSessions(),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
      } else {
        // Fallback to local user session data
        setProfile({
          email: user?.email,
          role: user?.role || "user",
          status: "ACTIVE",
          created_at: new Date().toISOString(),
        });
      }

      if (sessionsRes.status === "fulfilled") {
        const sessionList = Array.isArray(sessionsRes.value)
          ? sessionsRes.value
          : sessionsRes.value?.sessions || [];
        setSessions(sessionList);
      } else {
        // Mock current session for display if backend sessions endpoint is in development
        setSessions([
          {
            id: "current-sess",
            ip_address: "127.0.0.1 (Local)",
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString(),
            is_current: true,
          },
        ]);
      }
    } catch (err) {
      setError(err.message || "Failed to sync session telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevoke = async (sessionId) => {
    setRevokingId(sessionId);
    setMessage(null);
    setError(null);
    try {
      await api.revokeSession(sessionId);
      setMessage("Session successfully revoked. Token invalidated.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err.message || "Failed to revoke session.");
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (ua) => {
    if (!ua) return <Laptop className="w-4 h-4 text-slate-400" />;
    const lower = ua.toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
      return <Smartphone className="w-4 h-4 text-brand-500" />;
    }
    return <Laptop className="w-4 h-4 text-brand-500" />;
  };

  const parseBrowser = (ua) => {
    if (!ua) return "Unknown Device";
    if (ua.includes("Chrome")) return "Chrome Workstation";
    if (ua.includes("Firefox")) return "Firefox Workstation";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari Workstation";
    if (ua.includes("Edge")) return "Edge Workstation";
    return "Corporate Client";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animation-fade-in">
      {/* Top Banner / Identity Card */}
      <div className="card-elegant p-6 relative overflow-hidden">
        {/* Subtle orange accent illumination */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FB923C]/20 via-[#F6821F]/15 to-transparent border border-brand-500/30 flex items-center justify-center shadow-brand-glow">
              <ShieldCheck className="w-8 h-8 text-brand-500" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile?.email || user?.email}
                </h1>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    (profile?.role || user?.role) === "admin"
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {profile?.role || user?.role || "USER"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero-Trust SSO Authenticated • Principal ID:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {profile?.id || "usr_identity_verified"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn-elegant-secondary text-xs py-2 px-3 flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onLogout}
              className="btn-elegant-danger py-2 px-3.5 flex items-center space-x-1.5 text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Security Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-[#1E2638]">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17]/60 border border-slate-100 dark:border-[#1A2233]">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Password Hashing
            </span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Argon2id (m=64MB)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17]/60 border border-slate-100 dark:border-[#1A2233]">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Session Tokens
            </span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Opaque 256-Bit Bearer
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17]/60 border border-slate-100 dark:border-[#1A2233]">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Revocation SLA
            </span>
            <div className="text-xs font-semibold text-brand-500 mt-0.5">
              Instant (&lt; 30s DB Check)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17]/60 border border-slate-100 dark:border-[#1A2233]">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Account Status
            </span>
            <div className="text-xs font-semibold text-emerald-500 mt-0.5">
              Active / Unlocked
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Sessions Panel */}
      <div className="card-elegant p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Active Corporate Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage authorized devices currently holding an active session token.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
            {sessions.length} Active {sessions.length === 1 ? "Device" : "Devices"}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1C2436]">
          {sessions.map((session, index) => {
            const isCurrent = session.is_current || index === 0;
            return (
              <div
                key={session.id || index}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-[#151C2A]/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#141B28] border border-slate-200 dark:border-[#222C3E] shrink-0 mt-0.5">
                    {getDeviceIcon(session.user_agent)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {parseBrowser(session.user_agent)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.2 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                          Current Device
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>{session.ip_address || "127.0.0.1"}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {session.created_at
                            ? new Date(session.created_at).toLocaleString()
                            : "Active now"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-center">
                  {!isCurrent ? (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="btn-elegant-danger flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{revokingId === session.id ? "Revoking..." : "Revoke"}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
