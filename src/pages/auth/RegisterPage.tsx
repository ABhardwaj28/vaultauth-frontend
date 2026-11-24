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
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";
import { PasswordResetDialog } from "./LoginPage";

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
              Start secure.
              <br />
              Stay in control.
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
                Create your account
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Set up a secure identity on the VaultAuth SSO realm.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Success Banner */}
              {successMessage && (
                <Alert variant="default" className="rounded-lg border-border/70 bg-muted/40 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle className="text-sm font-semibold text-foreground">
                    Registration initiated
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-sm leading-relaxed">
                    {successMessage}{" "}
                    <Link to="/login" className="font-medium text-foreground underline decoration-border underline-offset-4">
                      Sign in now
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Banner */}
              {error && (
                <Alert variant="destructive" className="rounded-lg border-destructive/25 bg-destructive/[0.06] text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">Registration error</AlertTitle>
                  <AlertDescription className="mt-1 text-sm leading-relaxed">{error}</AlertDescription>
                </Alert>
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Master password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Real-time Policy Checklist */}
                {password && (
                  <div className="mt-1 space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isLengthValid ? "bg-foreground/70" : "bg-border"}`} />
                      <span className={isLengthValid ? "font-medium text-foreground/80" : "text-muted-foreground"}>
                        At least 12 characters ({password.length}/12)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-muted-foreground">
                      <span className={`flex items-center gap-2 ${hasUppercase ? "text-foreground/80" : ""}`}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasUppercase ? "bg-foreground/70" : "bg-border"}`} />
                        Uppercase
                      </span>
                      <span className={`flex items-center gap-2 ${hasLowercase ? "text-foreground/80" : ""}`}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasLowercase ? "bg-foreground/70" : "bg-border"}`} />
                        Lowercase
                      </span>
                      <span className={`flex items-center gap-2 ${hasNumberOrSymbol ? "text-foreground/80" : ""}`}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasNumberOrSymbol ? "bg-foreground/70" : "bg-border"}`} />
                        Number or symbol
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                        Max 128 bytes
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-lg border-border/80 bg-background/60 pl-10 text-sm focus-visible:border-foreground/25 focus-visible:ring-foreground/10 dark:bg-white/[0.03]"
                    disabled={loading}
                  />
                </div>
                {confirmPassword && (
                  <p className={`text-xs ${passwordsMatch ? "text-muted-foreground" : "text-destructive"}`}>
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !isLengthValid || !passwordsMatch}
                className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating your account…
                  </span>
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

              <div className="pt-1 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Sign in
                </Link>
              </div>

              <div className="pt-1 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="font-medium text-[#B25F12] underline decoration-transparent underline-offset-4 transition-colors hover:text-[#8A4A0E] hover:decoration-current dark:text-[#E5A068] dark:hover:text-[#F7B878]"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:px-10">
          <span>Protected by VaultAuth SSO</span>
          <span className="font-mono text-[11px]">req_4b9d70e2</span>
        </footer>
      </section>

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
