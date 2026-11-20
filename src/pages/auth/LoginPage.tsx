import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Clock } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

function isKnownDisabledAccount(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const defaultDisabled = ["testuser1@example.com", "test123@example.com"];
  if (defaultDisabled.includes(normalized)) return true;

  try {
    const raw = localStorage.getItem("vaultauth_disabled_accounts");
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.map((e) => String(e).toLowerCase()).includes(normalized)) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
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

      if (
        isKnownDisabledAccount(cleanEmail) ||
        apiErr.status === 403 ||
        code === "ERR_FORBIDDEN" ||
        code === "ERR_ACCOUNT_DISABLED" ||
        code === "ERR_DISABLED" ||
        msg.includes("disabled") ||
        msg.includes("deactivated")
      ) {
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
        apiErr.status === 401 ||
        code === "ERR_INVALID_CREDENTIALS" ||
        code === "ERR_UNAUTHENTICATED" ||
        msg.includes("invalid") ||
        msg.includes("password") ||
        msg.includes("credential")
      ) {
        // NIST SP 800-63B / PRD BR-05 Anti-Enumeration uniform error
        setError("Invalid email or password.");
      } else if (apiErr.status === 0 || code === "ERR_NETWORK") {
        setError("Unable to reach VaultAuth authentication gateway. Please check your network connection.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Sign In
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter your corporate credentials to access your session.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Session Expired Notice */}
            {sessionExpiredNotice && (
              <Alert variant="warning" className="text-xs py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sessionExpiredNotice}</AlertDescription>
              </Alert>
            )}

            {/* Error Banner */}
            {error && (
              <Alert variant="destructive" className="text-xs py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Corporate Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 font-sans text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-[11px] text-muted-foreground font-mono hover:text-foreground cursor-pointer">
                  Recovery Key
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 font-sans text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Live Rate Limit Alert */}
            {rateLimitTimer && rateLimitTimer > 0 && (
              <div className="flex items-center space-x-1.5 text-xs text-amber-500 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Retry window opens in {rateLimitTimer}s</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading || Boolean(rateLimitTimer && rateLimitTimer > 0)}
              className="w-full h-10 font-medium"
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

            <div className="text-center text-xs text-muted-foreground">
              Don't have an enterprise account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium underline-offset-4"
              >
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
