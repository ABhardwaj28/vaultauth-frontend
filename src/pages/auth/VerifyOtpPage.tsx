import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OtpInput } from "@/components/ui/otp-input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

// Countdown ring geometry — r=44 on a 100x100 viewBox.
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { setAuthSession } = useAuth();

  // Retrieve state or query param
  const locationState = location.state as
    | {
        email?: string;
        challengeId?: string;
        expiresIn?: number;
        method?: string;
        isRegistration?: boolean;
        redirectUrl?: string;
      }
    | undefined;

  const email = locationState?.email || searchParams.get("email") || "";
  // URL is authoritative so a refresh of this page keeps the challenge alive.
  const challengeId = searchParams.get("challenge_id") || locationState?.challengeId || undefined;
  const isRegistration = locationState?.isRegistration || searchParams.get("type") === "register";
  const redirectUrl = locationState?.redirectUrl || searchParams.get("redirect") || "/dashboard";
  const method = searchParams.get("method") || locationState?.method || "email";
  const isTotp = method === "totp";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // 60-second resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length < 6) {
      setError("Please input the complete 6-digit numeric passkey.");
      return;
    }

    setLoading(true);
    setError(null);
    setResendMessage(null);

    try {
      if (isRegistration) {
        // Verify registration email
        const res = await api.verifyEmail(email, code);
        navigate("/login", {
          state: {
            successMessage: res.message || "Email verified successfully! You may now sign in.",
          },
        });
      } else {
        // Verify 2FA challenge
        const res = await api.verify2FA({
          email,
          code,
          challenge_id: challengeId,
        });

        if (res.token) {
          api.setToken(res.token);
          const profile = await api.getMe();
          setAuthSession(res.token, profile);
          navigate(redirectUrl, { replace: true });
        }
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      setError(
        apiErr.message || "Invalid or expired security code. Attempts are rate-limited."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendMessage(null);

    if (!isRegistration && !challengeId) {
      setError("This verification challenge is no longer available. Return to sign in and start again.");
      return;
    }
    if (isRegistration) {
      setError("Email verification is not available on this service. Please contact support.");
      return;
    }

    try {
      const res = await api.resend2FA(challengeId as string);
      setResendMessage(
        res.message || "A new 6-digit verification code has been dispatched."
      );
      setResendCooldown(60);
      setAttemptsRemaining(3);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Unable to resend code at this time.");
    }
  };

  const ringOffset =
    RING_CIRCUMFERENCE *
    (1 - Math.min(resendCooldown, RESEND_COOLDOWN_SECONDS) / RESEND_COOLDOWN_SECONDS);

  return (
    <AuthShell>
      {/* Exact auth canvas colors over the shared shell */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#F6F7F9] dark:bg-[#0B0D11]" />

      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-white p-7 shadow-[0_12px_40px_-16px_rgba(16,24,40,0.18)] dark:border-white/[0.06] dark:bg-[#11141A] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8">
        <div className="space-y-3 pb-7 text-center">
          {/* Circular refresh countdown ring — the one signature element */}
          <div className="flex justify-center">
            <div className="relative h-28 w-28">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  className="stroke-border dark:stroke-white/10"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  stroke="#F07A26"
                  className="transition-[stroke-dashoffset] duration-500 ease-linear"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {resendCooldown}s
                </span>
                <span className="mt-1 text-[10px] font-medium tracking-[0.14em] text-muted-foreground">
                  Resend in
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-mono text-[11px] tracking-[0.14em]">Verification required</span>
          </div>

          <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.6rem]">
            {isTotp ? "Authenticator app" : "Check your email"}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            {isTotp ? (
              <>Enter the 6-digit code from your authenticator app.</>
            ) : (
              <>
                Enter the 6-digit code sent to{" "}
                <span className="font-mono text-[13px] font-medium text-foreground">
                  {email || "your email address"}
                </span>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          {/* Error Banner */}
          {error && (
            <Alert variant="destructive" className="rounded-lg border-destructive/25 bg-destructive/[0.06] text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">Verification failed</AlertTitle>
              <AlertDescription className="mt-1 text-sm leading-relaxed">{error}</AlertDescription>
            </Alert>
          )}

          {/* Resend Notice */}
          {resendMessage && (
            <Alert variant="default" className="rounded-lg border-border/70 bg-muted/40 text-sm text-foreground/80">
              <AlertDescription className="text-sm leading-relaxed">{resendMessage}</AlertDescription>
            </Alert>
          )}

          {/* 6-Cell Mono Code Cells */}
          <div className="py-1 [&_input]:h-14 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border-border/80 [&_input]:bg-background/60 [&_input]:text-2xl [&_input]:font-semibold [&_input]:shadow-none [&_input]:dark:bg-white/[0.03]">
            <OtpInput
              value={code}
              onChange={(val) => {
                setCode(val);
                if (val.length === 6) {
                  setError(null);
                }
              }}
              disabled={loading || attemptsRemaining === 0}
              error={Boolean(error)}
            />
          </div>

          {/* Attempt Feedback & Timer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Attempts remaining:{" "}
              <span
                className={`font-mono font-medium tabular-nums ${
                  attemptsRemaining <= 1
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {attemptsRemaining} of 3
              </span>
            </span>

            <span className="font-mono tabular-nums">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Ready to resend"}
            </span>
          </div>

          {/* Bottom action row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="h-11 rounded-lg border-border/80 bg-transparent text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend code
            </Button>

            <Button
              type="submit"
              disabled={loading || code.length < 6 || attemptsRemaining === 0}
              className="h-11 rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </span>
              ) : (
                "Verify code"
              )}
            </Button>
          </div>

          {attemptsRemaining === 0 ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/[0.05] px-3 py-2.5 text-center text-[13px] text-muted-foreground">
              No attempts left. {" "}
              <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Start a new sign-in
              </Link>
            </div>
          ) : (
            <div className="pt-1 text-center">
              <Button asChild variant="ghost" className="h-9 rounded-lg text-sm font-medium text-muted-foreground">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          )}
        </form>
      </div>
    </AuthShell>
  );
}
