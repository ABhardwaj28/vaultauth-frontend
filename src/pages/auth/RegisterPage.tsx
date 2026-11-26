import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";
import { PasswordResetDialog } from "./LoginPage";

/** A small ring that fills with a green dot when a requirement is met. */
function PolicyDot({ valid }: { valid: boolean }) {
  return (
    <span
      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
        valid ? "border-emerald-400/60 bg-emerald-500/15" : "border-border"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${valid ? "bg-emerald-400" : "bg-transparent"}`} />
    </span>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Password Policy Rules: Min 12 chars, max 128 bytes
  const isLengthValid = password.length >= 12 && password.length <= 128;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[\d\W]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please provide all required fields.");
      return;
    }

    if (!isLengthValid) {
      setError("Password must be at least 12 characters and at most 128 bytes.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({ email: cleanEmail, password });
      setSuccessMessage(
        res.message || "Account created successfully! Check your email or sign in to continue."
      );

      // Auto redirect to login or OTP verify after 2.5 seconds
      setTimeout(() => {
        navigate(`/login`, { replace: true });
      }, 2500);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code === "ERR_WEAK_PASSWORD" || apiErr.status === 422) {
        setError(
          apiErr.message || "Password does not meet enterprise complexity requirements."
        );
      } else {
        setError(apiErr.message || "Registration failed. Please verify your email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: "12+ characters", valid: password.length >= 12 },
    { label: "Mixed case", valid: hasUppercase && hasLowercase },
    { label: "Number or symbol", valid: hasNumberOrSymbol },
  ];

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
              Start secure.
              <br />
              Stay in control.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">
              Zero-trust single sign-on with hardware-backed credential protection.
            </p>

            <ul className="mt-7 space-y-3">
              {["Argon2id-protected credentials", "Mandatory email OTP", "Opaque sessions"].map((item) => (
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
          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8">
            <div className="mb-6 md:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-none bg-[#F07A26] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <h1 className="font-display text-[26px] font-bold tracking-[-0.03em] text-foreground">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Set up a secure identity on the VaultAuth SSO realm.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {successMessage && (
                <Alert variant="default" className="rounded-none border-border/70 bg-muted/40 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle className="text-sm font-semibold text-foreground">Registration initiated</AlertTitle>
                  <AlertDescription className="mt-1 text-sm leading-relaxed">
                    {successMessage}{" "}
                    <Link to="/login" className="font-medium text-foreground underline decoration-border underline-offset-4">
                      Sign in now
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="rounded-none border border-destructive/25 bg-destructive/[0.06] text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">Registration error</AlertTitle>
                  <AlertDescription className="mt-1 text-sm leading-relaxed">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">User email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" required autoFocus autoComplete="email"
                    placeholder="name@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-none border-border/80 bg-background/60 pl-9 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Master password</Label>
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
                    id="password" type={showPassword ? "text" : "password"} required autoComplete="new-password"
                    placeholder="••••••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-none border-border/80 bg-background/60 pl-9 pr-9 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
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

                {/* Real-time policy indicators — the small circles fill with a green dot */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                  {checks.map((check) => (
                    <span key={check.label} className={`inline-flex items-center gap-1.5 ${check.valid ? "text-emerald-500" : ""}`}>
                      <PolicyDot valid={check.valid} />
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[13px] font-semibold text-foreground">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword" type={showPassword ? "text" : "password"} required autoComplete="new-password"
                    placeholder="••••••••••••" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 rounded-none border-border/80 bg-background/60 pl-9 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
                {confirmPassword && (
                  <p className={`text-xs ${passwordsMatch ? "text-emerald-500" : "text-destructive"}`}>
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isLengthValid || !passwordsMatch}
                className="h-10 w-full rounded-none bg-[#F07A26] text-sm font-semibold text-white transition-colors hover:bg-[#DB6A16]"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating your account…</span>
                ) : (
                  "Create account"
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

              <p className="pt-1 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground sm:px-8">
            <span>Protected by VaultAuth SSO</span>
            <span className="font-mono">req_4b9d70e2</span>
          </div>
        </div>
      </div>

      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        initialEmail={email}
        onSuccess={(cleanEmail) => {
          setEmail(cleanEmail);
          navigate("/login", { replace: true });
        }}
      />
    </div>
  );
}
