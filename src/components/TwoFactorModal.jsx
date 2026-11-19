import React, { useState, useEffect, useRef } from "react";
import { KeyRound, ArrowRight, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import { api } from "../services/api";

export default function TwoFactorModal({
  email,
  challengeId,
  isRegistration = false,
  onSuccess,
  onCancel,
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const inputRefs = useRef([]);

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDigitChange = (index, val) => {
    // Only accept numeric digit
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const char = cleaned.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (pasteData.length === 6) {
      const split = pasteData.split("");
      setDigits(split);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit authentication code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegistration) {
        // Verify email registration
        const res = await api.verifyEmail(email, code);
        onSuccess({
          registered: true,
          message: res.message || "Account successfully verified! Please log in.",
        });
      } else {
        // Verify 2FA challenge
        const res = await api.verify2FA(email, code, challengeId);
        api.setSession(res);
        onSuccess({
          authenticated: true,
          user: {
            token: res.token,
            email: res.email || email,
            role: res.role || "user",
          },
        });
      }
    } catch (err) {
      setError(err.message || "Invalid or expired security code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setResendMessage(null);
    try {
      if (isRegistration) {
        await api.resendVerificationCode(email);
      }
      setResendMessage("A new verification code has been dispatched to your email.");
      setTimeLeft(600);
    } catch (err) {
      setError(err.message || "Failed to resend code. Please wait before retrying.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full animation-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 mb-3 shadow-brand-glow">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Enter the 6-digit challenge code dispatched to{" "}
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {email}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {resendMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
          {resendMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-6">
        {/* 6 Digit Inputs */}
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-semibold 
                         bg-white dark:bg-[#0B0F17] 
                         text-slate-900 dark:text-white 
                         border border-slate-200 dark:border-[#222C3E] 
                         rounded-xl focus:outline-none 
                         focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 
                         transition-all shadow-sm"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Expiry Timer & Resend */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-mono">
          <div className="flex items-center space-x-1.5">
            <span>Expires in:</span>
            <span
              className={`font-semibold ${
                timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-brand-500"
              }`}
            >
              {formatTimer(timeLeft)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || timeLeft > 540}
            className="text-xs hover:text-brand-500 dark:hover:text-brand-400 underline underline-offset-4 disabled:opacity-40 disabled:no-underline transition-colors"
          >
            {resending ? "Dispatching..." : "Resend Passcode"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={loading || digits.some((d) => !d)}
            className="w-full btn-elegant-primary"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Cryptographic Passcode...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Authenticate Session</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full btn-elegant-secondary"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
