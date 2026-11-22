import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

export function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setError(apiErr.message || "Registration failed. Please verify corporate email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">
        <div className="space-y-1.5 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Provision a new corporate identity on the VaultAuth SSO realm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Banner */}
          {successMessage && (
            <Alert variant="success" className="text-xs py-2.5 px-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Registration Initiated</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">
                {successMessage}{" "}
                <Link to="/login" className="underline font-semibold font-sans">
                  Sign in now
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Banner */}
          {error && (
            <Alert variant="destructive" className="text-xs py-2.5 px-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Registration Error</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">Corporate Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 rounded-lg bg-background/50 focus:bg-background text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">Master Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-10 rounded-lg bg-background/50 focus:bg-background text-sm"
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

            {/* Real-time Policy Checklist */}
            {password && (
              <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs space-y-1 mt-1">
                <div className="flex items-center space-x-1.5">
                  <span className={isLengthValid ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                    {isLengthValid ? "✓" : "○"} Min 12 Characters ({password.length}/12)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                  <span className={hasUppercase ? "text-emerald-500 font-medium" : ""}>
                    {hasUppercase ? "✓" : "○"} Uppercase
                  </span>
                  <span className={hasLowercase ? "text-emerald-500 font-medium" : ""}>
                    {hasLowercase ? "✓" : "○"} Lowercase
                  </span>
                  <span className={hasNumberOrSymbol ? "text-emerald-500 font-medium" : ""}>
                    {hasNumberOrSymbol ? "✓" : "○"} Number or Symbol
                  </span>
                  <span>Max 128 Bytes</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 h-10 rounded-lg bg-background/50 focus:bg-background text-sm"
                disabled={loading}
              />
            </div>
            {confirmPassword && (
              <span className={`text-[11px] font-mono ${passwordsMatch ? "text-emerald-500" : "text-destructive"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
              </span>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              disabled={loading || !isLengthValid || !passwordsMatch}
              className="w-full h-10 font-semibold rounded-lg shadow-xs"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Provisioning Account...</span>
                </span>
              ) : (
                <span>Create Account</span>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Already have an enterprise identity?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
