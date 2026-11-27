import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";

type Phase = "validating" | "ready" | "invalid" | "success";

const byteLength = (value: string) => new TextEncoder().encode(value).length;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = window.location.hash.replace(/^#/, "");

  const [phase, setPhase] = useState<Phase>("validating");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setPhase("invalid");
      setError("This reset link is missing its token.");
      return;
    }
    api
      .validateResetToken(token)
      .then((res) => {
        if (!active) return;
        setPhase(res.valid ? "ready" : "invalid");
        if (!res.valid) setError("This reset link is invalid or has expired.");
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiErr = err as ApiError;
        setError(apiErr?.message || "This reset link is invalid or has expired.");
        setPhase("invalid");
      });
    return () => { active = false; };
  }, [token]);

  const passwordValid = newPassword.length >= 12 && byteLength(newPassword) <= 128;
  const passwordsMatch = Boolean(newPassword) && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError("Use at least 12 characters and at most 128 bytes.");
      return;
    }
    if (!passwordsMatch) {
      setError("The password and confirmation do not match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await api.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setNotice(res.message ?? "Your password has been reset. You can now sign in.");
      setPhase("success");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const status = apiErr?.status;
      if (status === 400 || status === 404 || status === 410) {
        setError("This reset link is invalid or has expired. Request a new one.");
        setPhase("invalid");
      } else {
        setError(apiErr?.message || "Could not reset your password. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-white p-7 shadow-[0_12px_40px_-16px_rgba(16,24,40,0.18)] dark:border-white/[0.06] dark:bg-[#11141A] dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8">
        <div className="space-y-3 pb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {phase === "success" ? "Password updated" : "Choose a new password"}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            {phase === "validating"
              ? "Checking your reset link…"
              : phase === "invalid"
                ? "We couldn't use this link."
                : phase === "success"
                  ? "You can now sign in with your new password."
                  : "Setting a new password for your account."}
          </p>
        </div>

        {notice && phase !== "invalid" && (
          <p className="mb-4 rounded-lg border border-border/70 bg-muted/40 p-3 text-center text-xs leading-relaxed text-muted-foreground">
            {notice}
          </p>
        )}

        {error && phase === "invalid" && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {phase === "validating" && (
          <div className="flex justify-center py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {phase === "invalid" && (
          <Button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
          >
            Request a new link
          </Button>
        )}

        {phase === "success" && (
          <Button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
          >
            Back to sign in
          </Button>
        )}

        {phase === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-11 rounded-lg border-border/80 bg-background/60 pr-10 text-sm dark:bg-white/[0.03]"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {newPassword.length}/12 characters · {byteLength(newPassword)}/128 bytes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirm new password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="h-11 rounded-lg border-border/80 bg-background/60 text-sm dark:bg-white/[0.03]"
                disabled={busy}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={busy || !passwordValid || !passwordsMatch}
              className="h-11 w-full rounded-lg bg-[#F07A26] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#DB6A16]"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating password…
                </span>
              ) : (
                "Set new password"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
          <Link to="/login" className="underline decoration-border underline-offset-4 hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
