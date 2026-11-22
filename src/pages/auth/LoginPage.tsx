import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

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

  // Pre-sync disabled accounts on mount so fresh/incognito sessions immediately have real backend state
  useEffect(() => {
    api.syncDisabledAccounts().catch(() => {});
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

    // Check if account is in local disabled cache; verify live before blocking
    if (api.isAccountInDisabledCache(cleanEmail)) {
      const stillDisabled = await api.checkIsAccountDisabled(cleanEmail);
      if (stillDisabled) {
        setError("Account is disabled. Contact your administrator.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.login({ email: cleanEmail, password });

      // If 2FA OTP is required
      if (res.state === "OTP_REQUIRED" || res.challenge_id || res.requires_2fa) {
        navigate(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`, {
          state: {
            email: cleanEmail,
            challengeId: res.challenge_id,
            expiresIn: res.expires_in,
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

      let isDisabled =
        apiErr.status === 403 ||
        code === "ERR_FORBIDDEN" ||
        code === "ERR_ACCOUNT_DISABLED" ||
        code === "ERR_DISABLED" ||
        msg.includes("disabled") ||
        msg.includes("deactivated");

      if (!isDisabled && (apiErr.status === 401 || code === "ERR_INVALID_CREDENTIALS")) {
        try {
          isDisabled = await api.checkIsAccountDisabled(cleanEmail);
        } catch {
          // ignore
        }
      }

      if (isDisabled) {
        // Disabled account error per PRD & PAGES_AND_COMPONENTS Section 1.1
        setError("Account is disabled. Contact your administrator.");
      } else if (
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
      } else if (
        apiErr.status === 401 ||
        code === "ERR_INVALID_CREDENTIALS" ||
        code === "ERR_UNAUTHENTICATED" ||
        msg.includes("invalid") ||
        msg.includes("password") ||
        msg.includes("credential")
      ) {
        // NIST SP 800-63B / PRD BR-05 Anti-Enumeration uniform error
        setError("Invalid email or password.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 sm:p-7 shadow-[0_4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">
        {/* Header */}
        <div className="text-center space-y-1.5 pb-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign In to VaultAuth
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your enterprise credentials to access protected single sign-on applications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Expired Notice */}
          {sessionExpiredNotice && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs flex items-center space-x-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{sessionExpiredNotice}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block text-[11px] uppercase tracking-wider">Authentication Error</span>
                <span className="text-xs leading-relaxed block">{error}</span>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Corporate Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                  if (sessionExpiredNotice) setSessionExpiredNotice(null);
                }}
                className="pl-9 h-10 text-xs rounded-lg border-border/80 bg-background/50 focus:bg-background transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              <span className="text-[11px] text-muted-foreground hover:text-primary cursor-pointer transition-colors font-medium">
                Recovery Key
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                className="pl-9 pr-9 h-10 text-xs rounded-lg border-border/80 bg-background/50 focus:bg-background transition-colors"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Live Rate Limit Alert */}
          {rateLimitTimer && rateLimitTimer > 0 && (
            <div className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-mono font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Cooldown active: Retry in {rateLimitTimer}s</span>
            </div>
          )}

          {/* Submit Button & Links */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading || Boolean(rateLimitTimer && rateLimitTimer > 0)}
              className="w-full h-10 rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Don't have an enterprise account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
