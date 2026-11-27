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
  CheckCircle2,
} from "lucide-react";
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
 * Link-based password reset request. The email carries a reset link, so no OTP
 * input is collected here. Shared by the login and register screens.
 */
export function PasswordResetDialog({
  open,
  onOpenChange,
  initialEmail = "",
  onSuccess,
}: PasswordResetDialogProps) {
  const [step, setStep] = useState<1 | "done">(1);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const loading = busy;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStep(1);
      setEmail(initialEmail);
      setBusy(false);
      setError(null);
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
    setBusy(true);
    try {
      const res = await api.requestPasswordReset(cleanEmail);
      setEmail(cleanEmail);
      setResultMessage(
        responseMessage(
          res,
          "If an account exists for this email, a password reset link has been sent. Check your inbox."
        )
      );
      setStep("done");
    } catch (err: unknown) {
      setError(
        resetErrorMessage(err, "Could not send a reset link. Please try again.")
      );
    } finally {
      setBusy(false);
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
            {step === "done" ? "Check your inbox" : "Account recovery"}
          </span>
          <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {step === 1 ? "Reset your password" : "Check your email"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {step === 1
              ? "Enter your account email and we’ll send you a secure reset link."
              : "Follow the link in the email to choose a new password."}
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
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  "Email reset link"
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
                <p className="text-sm font-semibold text-foreground">Reset link sent</p>
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

  const applyAuthError = (err: unknown) => {
    const apiErr = err as ApiError;
    const msg = (apiErr.message || "").toLowerCase();
    const code = (apiErr.code || "").toUpperCase();

    if (code === "ERR_ACCOUNT_LOCKED" || msg.includes("locked")) {
      setError("Account is temporarily locked due to consecutive failed attempts. Contact your administrator or wait 5 minutes.");
    } else if (apiErr.status === 429 || code === "ERR_RATE_LIMITED" || msg.includes("rate limit")) {
      const remainingSecs = apiErr.rateLimitReset
        ? Math.max(1, Math.floor(apiErr.rateLimitReset - Date.now() / 1000))
        : 60;
      setRateLimitTimer(remainingSecs);
      setError(`Too many login attempts. Please wait ${remainingSecs} seconds before trying again.`);
    } else if (apiErr.status === 502 || apiErr.status === 503 || apiErr.status === 504 || code === "ERR_SERVICE_UNAVAILABLE") {
      setError("Authentication service is temporarily unavailable. Please try again shortly.");
    } else if (apiErr.status === 0 || code === "ERR_NETWORK" || code === "ERR_TIMEOUT") {
      setError("Unable to reach VaultAuth authentication gateway. Please check your network connection.");
    } else if (apiErr.status && apiErr.status >= 500) {
      setError("An internal authentication server error occurred. Please try again later.");
    } else {
      setError("Invalid email or password.");
    }
  };

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
      // Primary credentials only — the factor is chosen after this succeeds.
      const res = await api.login({ email: cleanEmail, password });

      if (res.mfa_required === true || res.challenge_id) {
        const methods = res.available_methods ?? [];
        sessionStorage.setItem(
          "vaultauth_pending_factor",
          JSON.stringify({ email: cleanEmail, password, methods, redirectUrl })
        );
        navigate("/select-factor");
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
      applyAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F1F2F5] px-4 py-8 text-foreground transition-colors duration-150 dark:bg-[#0B0D11]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_35%,hsl(var(--primary)/0.06),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-none border border-border/70 bg-white shadow-[0_30px_80px_-40px_rgba(16,24,40,0.45)] dark:border-white/[0.07] dark:bg-[#11141A] dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Compact always-dark brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#111318] p-7 text-white md:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-none border border-white/[0.06]" />
            <div className="absolute -bottom-20 -left-12 h-[300px] w-[300px] rounded-full border border-white/[0.05]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(240,122,38,0.16),transparent_60%)]" />
          </div>

          <div className="relative flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-none bg-[#F07A26] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-sm font-bold tracking-tight">VaultAuth</span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-white/45">SSO</span>
            </span>
          </div>

          <div className="relative py-8">
            <h2 className="font-display text-[30px] font-bold leading-[1.12] tracking-[-0.035em]">
              Sign in once.
              <br />
              Move freely.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              Zero-trust single sign-on with hardware-backed credential protection.
            </p>

            <ul className="mt-7 space-y-3">
              {["Argon2id protected", "Opaque sessions", "Instant revocation"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13px] text-white/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative font-mono text-[10px] text-white/35">zero-trust identity gateway</p>
        </aside>

        {/* Themed form panel */}
        <div className="relative flex flex-col">
          <div className="absolute right-4 top-4 z-10">
            </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8">
            <div className="mb-6 md:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-none bg-[#F07A26] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <h1 className="font-display text-[26px] font-bold tracking-[-0.03em] text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your credentials.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {sessionExpiredNotice && (
                <div className="flex items-start gap-2.5 rounded-none border border-border/70 bg-muted/40 p-2.5 text-sm text-foreground/80">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="leading-relaxed">{sessionExpiredNotice}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-none border border-destructive/25 bg-destructive/[0.06] p-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="block font-semibold">Authentication error</span>
                    <span className="block leading-relaxed">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">User email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" required autoFocus autoComplete="email"
                    placeholder="name@example.com" value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                      if (sessionExpiredNotice) setSessionExpiredNotice(null);
                    }}
                    className="h-10 rounded-none border-border/80 bg-background/60 pl-9 text-sm dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Password</Label>
                  <button
                    type="button" onClick={() => setResetOpen(true)}
                    className="text-xs font-medium text-[#C96B1E] underline-offset-4 hover:underline dark:text-[#E5A068]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                    placeholder="••••••••••••" value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                      if (sessionExpiredNotice) setSessionExpiredNotice(null);
                    }}
                    className="h-10 rounded-none border-border/80 bg-background/60 pl-9 pr-9 text-sm dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                    tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {rateLimitTimer && rateLimitTimer > 0 && (
                <div className="flex items-center gap-2 rounded-none border border-border/70 bg-muted/40 p-2.5 text-sm text-foreground/80">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Try again in <span className="font-mono font-medium tabular-nums">{rateLimitTimer}s</span>.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || Boolean(rateLimitTimer && rateLimitTimer > 0)}
                className="h-10 w-full rounded-none bg-[#F07A26] text-sm font-semibold text-white transition-colors hover:bg-[#DB6A16]"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</span>
                ) : (
                  "Continue"
                )}
              </Button>

              <p className="pt-1 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link to="/register" className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Create an account
                </Link>
              </p>
            </form>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground sm:px-8">
            <span>Protected by VaultAuth SSO</span>
            <span className="font-mono">req_8f2c41d9</span>
          </div>
        </div>
      </div>

      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        initialEmail={email}
        onSuccess={(cleanEmail) => setEmail(cleanEmail)}
      />
    </div>
  );

}
