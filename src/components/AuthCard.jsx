import React, { useState } from "react";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import TwoFactorModal from "./TwoFactorModal";

export default function AuthCard({ onAuthenticated }) {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  const [otpChallenge, setOtpChallenge] = useState(null); // { email, challengeId, isRegistration }
  const [notification, setNotification] = useState(null);

  const handleNeedOTP = (challenge) => {
    setOtpChallenge(challenge);
  };

  const handleOtpSuccess = (res) => {
    if (res.registered) {
      setOtpChallenge(null);
      setActiveTab("login");
      setNotification({
        type: "success",
        message: res.message || "Account registered and verified! You can now sign in.",
      });
    } else if (res.authenticated) {
      onAuthenticated(res.user);
    }
  };

  const handleOtpCancel = () => {
    setOtpChallenge(null);
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Subtle trademark ambient glow behind the card */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="card-elegant p-6 sm:p-8 relative">
        {/* If in OTP Challenge mode */}
        {otpChallenge ? (
          <TwoFactorModal
            email={otpChallenge.email}
            challengeId={otpChallenge.challengeId}
            isRegistration={otpChallenge.isRegistration}
            onSuccess={handleOtpSuccess}
            onCancel={handleOtpCancel}
          />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FB923C]/20 via-[#F6821F]/15 to-transparent border border-brand-500/30 text-brand-500 mb-3 shadow-brand-glow">
                <ShieldCheck className="w-6 h-6 text-brand-500" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Enterprise Single Sign-On
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Zero-trust identity verification for authorized personnel
              </p>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notification.message}</span>
              </div>
            )}

            {/* Segmented Tab Switcher */}
            <div className="flex p-1 mb-6 rounded-xl bg-slate-100 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-[#1E2638]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setNotification(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 select-none ${
                  activeTab === "login"
                    ? "bg-white dark:bg-[#161D2B] text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-[#222C3E]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setNotification(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 select-none ${
                  activeTab === "register"
                    ? "bg-white dark:bg-[#161D2B] text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-[#222C3E]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Views */}
            {activeTab === "login" ? (
              <LoginForm
                onNeedOTP={handleNeedOTP}
                onAuthenticated={onAuthenticated}
              />
            ) : (
              <RegisterForm onNeedOTP={handleNeedOTP} />
            )}
          </>
        )}
      </div>

      {/* Security Assurance Footer Note */}
      <div className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-2 font-mono">
        <Lock className="w-3 h-3 text-brand-500" />
        <span>Hardware Isolation • Argon2id • Mutual TLS</span>
      </div>
    </div>
  );
}
