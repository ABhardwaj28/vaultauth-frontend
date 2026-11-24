import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

const utf8ByteLength = (value: string) => new TextEncoder().encode(value).length;

function resetErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as Partial<ApiError> | undefined;
  const message = apiErr?.message?.trim();
  if (message) return message;
  if (apiErr?.status === 0) {
    return "Unable to reach the VaultAuth authentication gateway. Please check your network connection.";
  }
  return fallback;
}

function responseMessage(res: unknown, fallback: string): string {
  const data = res as unknown as { message?: unknown } | null | undefined;
  const message = data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  onSuccess?: (email: string) => void;
}

/**
 * Two-step, API-backed password reset. Shared by the login and register screens;
 * it is intentionally self-contained so neither screen's existing auth logic changes.
 */
export function PasswordResetDialog({
  open,
  onOpenChange,
  initialEmail = "",
  onSuccess,
}: PasswordResetDialogProps) {
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [busy, setBusy] = useState<"request" | "verify" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const loading = busy !== null;
  const passwordBytes = utf8ByteLength(newPassword);
  const isPasswordValid = newPassword.length >= 12 && passwordBytes <= 128;
  const isCodeValid = /^\d{6}$/.test(code);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStep(1);
      setEmail(initialEmail);
      setCode("");
      setNewPassword("");
      setShowNewPassword(false);
      setBusy(null);
      setError(null);
      setNotice(null);
      setResultMessage(null);
    }
    onOpenChange(next);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setNotice(null);
    setBusy("request");
    try {
      const res = await api.requestPasswordReset(cleanEmail);
      setEmail(cleanEmail);
      setNotice(
        responseMessage(res, "If an account exists for this email, a reset code has been sent.")
      );
      setStep(2);
    } catch (err: unknown) {
      setError(
        resetErrorMessage(err, "Could not send a reset code. Please try again.")
      );
    } finally {
      setBusy(null);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid) {
      setError("Enter the 6-digit code sent to your email address.");
      return;
    }
    if (!isPasswordValid) {
      setError("New password must be at least 12 characters and at most 128 bytes.");
      return;
    }
    setError(null);
    try {
      setBusy("verify");
      await api.verifyResetCode(email, code);
      setBusy("reset");
      const res = await api.resetPassword(email, code, newPassword);
      setResultMessage(
        responseMessage(res, "Your password has been reset. You can now sign in.")
      );
      setStep("done");
    } catch (err: unknown) {
      setError(
        resetErrorMessage(err, "Could not reset your password. Please try again.")
      );
    } finally {
      setBusy(null);
    }
  };

  const errorBanner = error ? (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{error}</span>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[420px] rounded-xl border border-border/70 bg-white p-7 text-foreground shadow-[0_12px_40px_-16px_rgba(16,24,40,0.18)] dark:border-white/[0.06] dark:bg-[#11141A] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8"
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader className="text-left">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#B25F12] dark:text-[#E5A068]">
            {step === "done" ? "Complete" : `Step ${step} of 2`}
          </span>
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {step === 1
              ? "Reset your password"
              : step === 2
                ? "Verify and reset"
                : "You’re all set"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {step === 1
              ? "Enter your account email and we’ll send you a one-time reset code."
              : step === 2
                ? "Enter the code we sent you and choose a new password."
                : "You can now sign in with your new password."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            {errorBanner}
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                User email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="h-11 flex-1 rounded-lg text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="h-11 flex-[2] rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
              >
                {busy === "request" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code…
                  </span>
                ) : (
                  "Send reset code"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCompleteReset} className="space-y-4">
            {notice && (
              <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B25F12] dark:text-[#E5A068]" />
                <span className="leading-relaxed">{notice}</span>
              </div>
            )}
            {errorBanner}
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              Code sent to <span className="font-medium text-foreground">{email}</span>
              <span className="ml-1 underline decoration-border underline-offset-4">Change</span>
            </button>

            <div className="space-y-2">
              <Label htmlFor="reset-code" className="text-sm font-medium text-foreground">
                Reset code
              </Label>
              <Input
                id="reset-code"
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (error) setError(null);
                }}
                className="h-11 rounded-lg border-border/80 bg-background/60 text-center font-mono text-base tracking-[0.4em] focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Enter the 6-digit code from your email.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-password" className="text-sm font-medium text-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 pr-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use at least 12 characters and at most 128 bytes.{" "}
                <span className={newPassword && !isPasswordValid ? "text-destructive" : ""}>
                  {newPassword.length}/12 characters · {passwordBytes}/128 bytes
                </span>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                disabled={loading}
                className="h-11 flex-1 rounded-lg text-sm"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || !isCodeValid || !isPasswordValid}
                className="h-11 flex-[2] rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
              >
                {busy === "verify" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying code…
                  </span>
                ) : busy === "reset" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting password…
                  </span>
                ) : (
                  "Reset password"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Password reset complete</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{resultMessage}</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                handleOpenChange(false);
                onSuccess?.(email);
              }}
              className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
            >
              Return to sign in
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { setAuthSession, sessionExpiredNotice, setSessionExpiredNotice } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Clean up any stale disabled account caches
  useEffect(() => {
    try {
      localStorage.removeItem("vaultauth_disabled_accounts");
      sessionStorage.removeItem("vaultauth_disabled_accounts");
    } catch {
      // ignore
    }
  }, []);

  // Live countdown timer for rate-limit cooldown
  useEffect(() => {
    if (!rateLimitTimer || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => {
        if (!prev || prev <= 1) {
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSessionExpiredNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({ email: cleanEmail, password, factor: "email" });

      // If 2FA OTP is required
      if (res.state === "OTP_REQUIRED" || res.challenge_id || res.requires_2fa) {
        const challengeParam = res.challenge_id
          ? `&challenge_id=${encodeURIComponent(res.challenge_id)}`
          : "";
        const redirectParam = redirectUrl && redirectUrl !== "/dashboard"
          ? `&redirect=${encodeURIComponent(redirectUrl)}`
          : "";
        const methodParam = res.method ? `&method=${encodeURIComponent(res.method)}` : "";
        navigate(`/verify-otp?email=${encodeURIComponent(cleanEmail)}${challengeParam}${redirectParam}${methodParam}`, {
          state: {
            email: cleanEmail,
            challengeId: res.challenge_id,
            expiresIn: res.expires_in,
            method: res.method,
            isRegistration: false,
            redirectUrl,
          },
        });
        return;
      }

      // If token minted directly
      if (res.token) {
        api.setToken(res.token);
        const profile = await api.getMe();
        setAuthSession(res.token, profile);
        navigate(redirectUrl, { replace: true });
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = (apiErr.message || "").toLowerCase();
      const code = (apiErr.code || "").toUpperCase();

      if (
        code === "ERR_ACCOUNT_LOCKED" ||
        msg.includes("locked")
      ) {
        // 3-strike temporary lockout error per PRD BR-03
        setError("Account is temporarily locked due to consecutive failed attempts. Contact your administrator or wait 5 minutes.");
      } else if (
        apiErr.status === 429 ||
        code === "ERR_RATE_LIMITED" ||
        msg.includes("rate limit")
      ) {
        const remainingSecs = apiErr.rateLimitReset
          ? Math.max(1, Math.floor(apiErr.rateLimitReset - Date.now() / 1000))
          : 60;
        setRateLimitTimer(remainingSecs);
        setError(`Too many login attempts. Please wait ${remainingSecs} seconds before trying again.`);
      } else if (
        apiErr.status === 502 ||
        apiErr.status === 503 ||
        apiErr.status === 504 ||
        code === "ERR_SERVICE_UNAVAILABLE"
      ) {
        setError("Authentication service is temporarily unavailable. Please try again shortly.");
      } else if (apiErr.status === 0 || code === "ERR_NETWORK" || code === "ERR_TIMEOUT") {
        setError("Unable to reach VaultAuth authentication gateway. Please check your network connection.");
      } else if (apiErr.status && apiErr.status >= 500) {
        setError("An internal authentication server error occurred. Please try again later.");
      } else {
        // When user is disabled by an admin or credentials are invalid, return identical message
        // Prevents account enumeration and reflects real-time backend authentication
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F7F9] text-foreground transition-colors duration-150 dark:bg-[#0B0D11]">
      {/* Always-dark brand panel — hidden on small screens */}
      <aside className="relative hidden lg:flex lg:w-[48%] xl:w-[46%] shrink-0 flex-col overflow-hidden bg-[#111318] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute -left-56 -bottom-72 h-[680px] w-[680px] rounded-full border border-white/[0.05]" />
          <div className="absolute -left-40 -bottom-56 h-[560px] w-[560px] rounded-full border border-white/[0.04]" />
          <div className="absolute -left-24 -bottom-40 h-[440px] w-[440px] rounded-full border border-white/[0.03]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 22% 82%, rgba(255,255,255,0.045), transparent 55%)",
            }}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-16 xl:py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
              <ShieldCheck className="h-5 w-5 text-white/80" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-sm font-semibold tracking-tight">VaultAuth</span>
              <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-white/45">
                SSO
              </span>
            </div>
          </div>

          <div className="my-auto max-w-md py-10">
            <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-[-0.03em] xl:text-[3.25rem]">
              Sign in once.
              <br />
              Move freely.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-400">
              Zero-trust single sign-on with hardware-backed credential protection.
            </p>

            <ul className="mt-10 space-y-4">
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                  <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                </span>
                Argon2id-protected credentials
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                  <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                </span>
                Scoped, short-lived sessions
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                  <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                </span>
                Continuous access verification
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">
            © 2026 VaultAuth. Zero-trust identity gateway.
          </p>
        </div>
      </aside>

      {/* Themed form panel */}
      <section className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-[#F6F7F9] text-foreground transition-colors duration-150 dark:bg-[#0B0D11]">
        <div className="absolute right-5 top-5 z-20">
          <ThemeToggle />
        </div>

        {/* Brand mark sits above the form on mobile */}
        <div className="relative z-10 flex items-center gap-2.5 px-6 pt-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/15 bg-foreground/[0.04]">
            <ShieldCheck className="h-4 w-4 text-foreground/75" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-sm font-semibold tracking-tight text-foreground">
              VaultAuth
            </span>
            <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-muted-foreground">
              SSO
            </span>
          </div>
        </div>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-10 sm:py-16">
          <div className="w-full max-w-[400px] rounded-xl border border-border/70 bg-white p-7 shadow-[0_12px_40px_-16px_rgba(16,24,40,0.18)] dark:border-white/[0.06] dark:bg-[#11141A] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8">
            <header className="mb-8">
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sign in with your credentials.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Session Expired Notice */}
              {sessionExpiredNotice && (
                <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-foreground/80">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium leading-relaxed">{sessionExpiredNotice}</span>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-1">
                    <span className="block font-semibold">Authentication error</span>
                    <span className="block leading-relaxed">{error}</span>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  User email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                      if (sessionExpiredNotice) setSessionExpiredNotice(null);
                    }}
                    className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs font-medium text-[#B25F12] underline decoration-transparent underline-offset-4 transition-colors hover:text-[#8A4A0E] hover:decoration-current dark:text-[#E5A068] dark:hover:text-[#F7B878]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                      if (sessionExpiredNotice) setSessionExpiredNotice(null);
                    }}
                    className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 pr-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
              </div>

              {/* Live Rate Limit Alert */}
              {rateLimitTimer && rateLimitTimer > 0 && (
                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 p-2.5 text-sm text-foreground/80">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    You can try again in{" "}
                    <span className="font-mono font-medium tabular-nums">{rateLimitTimer}s</span>.
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || Boolean(rateLimitTimer && rateLimitTimer > 0)}
                className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying credentials…
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border/80" />
                <span className="text-xs text-muted-foreground">Or continue with</span>
                <span className="h-px flex-1 bg-border/80" />
              </div>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                OIDC federation is configured by your administrator.
              </p>

              <div className="pt-1 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </main>

        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:px-10">
          <span>Protected by VaultAuth SSO</span>
          <span className="font-mono text-[11px]">req_8f2c41d9</span>
        </footer>
      </section>

      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        initialEmail={email}
        onSuccess={(cleanEmail) => setEmail(cleanEmail)}
      />
    </div>
  );
}
