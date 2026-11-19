import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

export default function RegisterForm({ onNeedOTP }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NIST SP 800-63B Requirements Evaluation
  const rules = {
    length: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumberOrSymbol: /[\d\W]/.test(password),
  };

  const strengthScore = Object.values(rules).filter(Boolean).length;
  const isPasswordValid = rules.length;
  const doPasswordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!rules.length) {
      setError("Password must be at least 12 characters to satisfy NIST SP 800-63B standards.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptPolicy) {
      setError("Please accept the corporate security policy to continue.");
      return;
    }

    setLoading(true);

    try {
      await api.register(email, password);
      // Backend dispatches 6-digit confirmation code and sets account to PENDING
      onNeedOTP({
        email,
        isRegistration: true,
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please verify corporate domain.");
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
            placeholder="new.employee@company.com"
            className="input-elegant pl-9"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Set Master Passphrase
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
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

        {/* Dynamic NIST Strength Indicator */}
        {password && (
          <div className="mt-2 space-y-1.5">
            <div className="flex h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`transition-all duration-300 ${
                  strengthScore <= 1
                    ? "w-1/4 bg-rose-500"
                    : strengthScore <= 3
                    ? "w-3/4 bg-amber-500"
                    : "w-full bg-brand-500 shadow-brand-glow"
                }`}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center space-x-1">
                <span className={rules.length ? "text-brand-500 font-semibold" : ""}>
                  • Min 12 Characters ({password.length}/12)
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className={rules.hasUpper ? "text-brand-500 font-semibold" : ""}>
                  • Uppercase Letter
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className={rules.hasLower ? "text-brand-500 font-semibold" : ""}>
                  • Lowercase Letter
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className={rules.hasNumberOrSymbol ? "text-brand-500 font-semibold" : ""}>
                  • Number or Symbol
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Confirm Master Passphrase
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="input-elegant pl-9 pr-10"
          />
          {confirmPassword && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {doPasswordsMatch ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <span className="text-[10px] text-rose-500 font-medium">Mismatch</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptPolicy}
            onChange={(e) => setAcceptPolicy(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500/30"
          />
          <span>
            I acknowledge adherence to the corporate Zero-Trust Acceptable Use Policy and 2FA credential requirements.
          </span>
        </label>
      </div>

      {/* Trademark Elegant Submit Button */}
      <button
        type="submit"
        disabled={loading || !rules.length || !doPasswordsMatch || !acceptPolicy}
        className="w-full btn-elegant-primary mt-2"
      >
        {loading ? (
          <span className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Minting Provisioning Challenge...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>Provision Corporate Identity</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </button>
    </form>
  );
}
