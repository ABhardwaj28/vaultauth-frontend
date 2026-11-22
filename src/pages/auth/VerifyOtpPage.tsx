import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OtpInput } from "@/components/ui/otp-input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

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
        isRegistration?: boolean;
        redirectUrl?: string;
      }
    | undefined;

  const email = locationState?.email || searchParams.get("email") || "";
  const challengeId = locationState?.challengeId || searchParams.get("challenge_id") || undefined;
  const isRegistration = locationState?.isRegistration || searchParams.get("type") === "register";
  const redirectUrl = locationState?.redirectUrl || "/dashboard";

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

    try {
      if (isRegistration) {
        await api.resendVerifyEmail(email);
      }
      setResendMessage("A new 6-digit verification code has been dispatched.");
      setResendCooldown(60);
      setAttemptsRemaining(3);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Unable to resend code at this time.");
    }
  };

  return (
    <AuthShell>
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">
        <div className="space-y-1.5 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Two-Factor Verification
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Enter the 6-digit security code dispatched to{" "}
            <span className="font-mono text-foreground font-medium">
              {email || "your corporate email"}
            </span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          {/* Error Banner */}
          {error && (
            <Alert variant="destructive" className="text-xs py-2.5 px-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Verification Failed</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">{error}</AlertDescription>
            </Alert>
          )}

          {/* Resend Notice */}
          {resendMessage && (
            <Alert variant="success" className="text-xs py-2.5 px-3 rounded-lg">
              <AlertDescription className="text-xs">{resendMessage}</AlertDescription>
            </Alert>
          )}

          {/* 6-Cell Segmented OtpInput */}
          <div className="py-2">
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
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="tabular-nums">
              Attempts:{" "}
              <span
                className={
                  attemptsRemaining <= 1
                    ? "text-destructive font-semibold"
                    : "text-foreground font-medium"
                }
              >
                {attemptsRemaining} of 3 left
              </span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="hover:text-foreground disabled:opacity-50 transition-colors focus:outline-none"
            >
              {resendCooldown > 0 ? (
                <span className="tabular-nums">Resend in {resendCooldown}s</span>
              ) : (
                <span className="flex items-center text-primary font-sans font-medium">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Resend Code
                </span>
              )}
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={loading || code.length < 6 || attemptsRemaining === 0}
              className="w-full h-10 font-semibold rounded-lg shadow-xs"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Validating Passcode...</span>
                </span>
              ) : (
                <span>Verify & Proceed</span>
              )}
            </Button>

            <Button asChild variant="ghost" className="w-full h-9 rounded-lg text-xs font-medium">
              <Link to="/login">Cancel & Return to Sign In</Link>
            </Button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
