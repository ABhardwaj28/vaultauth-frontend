import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import ZeroTrustBadge from "./ZeroTrustBadge";
import { api } from "../services/api";

export default function LoginForm({ onNeedOTP, onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zeroTrustVerified, setZeroTrustVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide both your corporate email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.login(email, password);

      // Backend returns OTP_REQUIRED state with challenge_id
      if (res.state === "OTP_REQUIRED" || res.challenge_id || res.requires_2fa) {
        onNeedOTP({
          email,
          challengeId: res.challenge_id,
          isRegistration: false,
        });
        return;
      }

      // If direct token returned (e.g. single-step or mock mode)
      if (res.token) {
        api.setSession(res);
        onAuthenticated({
          token: res.token,
          email: res.email || email,
          role: res.role || "user",
        });
      }
    } catch (err) {
      // BR-05 Anti-enumeration: uniformly handles invalid credentials
      if (err.code === "ERR_ACCOUNT_LOCKED" || err.message?.includes("locked")) {
        setError("Account is temporarily locked due to multiple failed attempts. Please try again later or contact your administrator.");
      } else {
        setError(err.message || "Invalid corporate credentials. Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animation-fade-in">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Corporate Email Field */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Corporate Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            className="input-elegant pl-9"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-brand-500 cursor-pointer">
            Hardware Key / Recovery
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="input-elegant pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cloudflare-inspired Zero-Trust Verification Check */}
      <ZeroTrustBadge onVerified={(v) => setZeroTrustVerified(v)} />

      {/* Options Row */}
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500/30"
          />
          <span>Remember workstation (30d)</span>
        </label>
      </div>

      {/* Trademark Elegant Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-elegant-primary mt-2"
      >
        {loading ? (
          <span className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Validating Argon2id Hash...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>Authenticate Identity</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </button>
    </form>
  );
}
