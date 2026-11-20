import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
          apiErr.message || "Password does not meet enterprise cryptographic complexity standards."
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
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1.5 pb-4 text-center">
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10 rounded-lg bg-[#F6821F] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Create an Account
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Provision a new corporate identity on the VaultAuth SSO realm.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Success Banner */}
            {successMessage && (
              <Alert variant="success" className="text-xs py-2 px-3">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Registration Initiated</AlertTitle>
                <AlertDescription>
                  {successMessage}{" "}
                  <Link to="/login" className="underline font-semibold font-sans">
                    Sign in now
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Banner */}
            {error && (
              <Alert variant="destructive" className="text-xs py-2 px-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Registration Error</AlertTitle>
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
                  placeholder="employee@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 font-sans text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
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

              {/* Real-time NIST Policy Checklist */}
              {password && (
                <div className="pt-1.5 space-y-1 text-[11px] font-mono text-muted-foreground">
                  <div className="flex items-center space-x-1.5">
                    <span className={isLengthValid ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                      {isLengthValid ? "✓" : "○"} Min 12 Characters ({password.length}/12)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={hasUppercase ? "text-emerald-500" : ""}>
                      {hasUppercase ? "✓" : "○"} Uppercase Letter
                    </span>
                    <span className={hasLowercase ? "text-emerald-500" : ""}>
                      {hasLowercase ? "✓" : "○"} Lowercase Letter
                    </span>
                    <span className={hasNumberOrSymbol ? "text-emerald-500" : ""}>
                      {hasNumberOrSymbol ? "✓" : "○"} Number or Symbol
                    </span>
                    <span className="text-muted-foreground">Max 128 Bytes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 font-sans text-sm"
                  disabled={loading}
                />
              </div>
              {confirmPassword && (
                <span className={`text-[11px] font-mono ${passwordsMatch ? "text-emerald-500" : "text-destructive"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !isLengthValid || !passwordsMatch}
              className="w-full h-10 font-medium"
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
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
