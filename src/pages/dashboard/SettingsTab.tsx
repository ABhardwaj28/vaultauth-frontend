import { useState } from "react";
import {
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MfaSection } from "@/components/dashboard/MfaSection";

export function SettingsTab() {
  const { refreshProfile } = useAuth();
  const { resolvedTheme, isUserControlled, setTheme } = useTheme();

  // Revoke other sessions state
  const [revokingAll, setRevokingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const sessions = await api.getMySessions();
      const otherSessions = sessions.filter((s) => !s.current && !s.is_current);

      if (otherSessions.length === 0) {
        setSuccessMsg("No other active sessions to revoke. Only your current workstation is authenticated.");
        return;
      }

      for (const s of otherSessions) {
        await api.revokeSession(s.id);
      }

      setSuccessMsg(`Successfully terminated ${otherSessions.length} other active session(s).`);
      await refreshProfile();
    } catch (err: unknown) {
      setErrorMsg((err as { message?: string })?.message || "Failed to terminate other sessions.");
    } finally {
      setRevokingAll(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError("New password must be at least 12 characters.");
      return;
    }

    if (newPassword.length > 128) {
      setPasswordError("New password exceeds maximum length of 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password cannot be identical to your current password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || "Password updated successfully. Your new credentials are active.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError((err as { message?: string })?.message || "Failed to update password. Please check your current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-5 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            Account and security settings
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Credentials, verification, and appearance for this account.
          </p>
        </div>
      </div>

      {/* Global notices */}
      {successMsg && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 leading-relaxed">{successMsg}</span>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 leading-relaxed">{errorMsg}</span>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
        </div>
      )}

      {/* One ledger sheet — hairline-divided sections */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Credentials */}
        <section className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                Password
              </h2>
              <p className="text-sm text-muted-foreground">
                Update the credential you use to sign in.
              </p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              min. 12 characters
            </span>
          </div>

          <form onSubmit={handleChangePassword} className="mt-5 max-w-xl space-y-3.5">
            {passwordSuccess && (
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-background/60 px-3 py-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 leading-relaxed">{passwordSuccess}</span>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              </div>
            )}

            {passwordError && (
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-background/60 px-3 py-2.5 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 leading-relaxed">{passwordError}</span>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-[13px] font-medium text-foreground">
                Current password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-9 rounded-md border-border/70 bg-background/60 pr-9 text-sm focus:bg-card"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-[13px] font-medium text-foreground">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                  className="h-9 rounded-md border-border/70 bg-background/60 pr-9 text-sm focus:bg-card"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-[13px] font-medium text-foreground">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="h-9 rounded-md border-border/70 bg-background/60 pr-9 text-sm focus:bg-card"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="h-9 rounded-md px-4 text-sm font-semibold"
              >
                {updatingPassword ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Updating credentials
                  </span>
                ) : (
                  <span>Update password</span>
                )}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Takes effect on the next sign-in.
              </span>
            </div>
          </form>
        </section>

        <MfaSection />

        {/* Appearance */}
        <section className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                Appearance
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose how the portal renders while you are signed in.
              </p>
            </div>
          </div>

          <div className="mt-5 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={resolvedTheme === "light"}
              className={`relative rounded-md border p-2.5 text-left transition-colors ${
                resolvedTheme === "light"
                  ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                  : "border-border/70 bg-background/50 hover:border-primary/30"
              }`}
            >
              {resolvedTheme === "light" && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary" />}
              <span className="block overflow-hidden rounded-sm border border-border/70 bg-white">
                <span className="flex h-3 items-center gap-1 border-b border-slate-200 bg-slate-50 px-1.5">
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                </span>
                <span className="block space-y-1.5 p-2">
                  <span className="block h-1.5 w-3/4 rounded-full bg-slate-200" />
                  <span className="block h-1.5 w-1/2 rounded-full bg-slate-200" />
                </span>
              </span>
              <span className={`mt-2.5 block font-display text-[13px] font-semibold ${resolvedTheme === "light" ? "text-primary" : "text-foreground"}`}>
                Light
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">Bright canvas</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={resolvedTheme === "dark"}
              className={`relative rounded-md border p-2.5 text-left transition-colors ${
                resolvedTheme === "dark"
                  ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                  : "border-border/70 bg-background/50 hover:border-primary/30"
              }`}
            >
              {resolvedTheme === "dark" && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary" />}
              <span className="block overflow-hidden rounded-sm border border-[#272A38] bg-[#14151C]">
                <span className="flex h-3 items-center gap-1 border-b border-[#272A38] bg-[#1C1D27] px-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#3A3D4D]" />
                  <span className="h-1 w-1 rounded-full bg-[#3A3D4D]" />
                </span>
                <span className="block space-y-1.5 p-2">
                  <span className="block h-1.5 w-3/4 rounded-full bg-[#333545]" />
                  <span className="block h-1.5 w-1/2 rounded-full bg-[#333545]" />
                </span>
              </span>
              <span className={`mt-2.5 block font-display text-[13px] font-semibold ${resolvedTheme === "dark" ? "text-primary" : "text-foreground"}`}>
                Dark
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">Low-light canvas</span>
            </button>
          </div>

          <div className="mt-4 flex max-w-xl items-center justify-between border-t border-border/60 pt-3 text-[13px]">
            <span className="text-muted-foreground">Active mode</span>
            <span className="font-mono text-xs text-primary">
              {resolvedTheme}
              {!isUserControlled && <span className="ml-1.5 text-muted-foreground">(detected at sign-in)</span>}
            </span>
          </div>
          <p className="mt-2 max-w-xl text-[11px] leading-5 text-muted-foreground">
            Sign-in pages follow your device setting. Your choice here takes effect once you are signed in and persists for future sessions.
          </p>
        </section>
      </div>

      {/* Danger zone — separated by a thin rule */}
      <div className="border-t border-border pt-5">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
              <Laptop className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                Other workstations
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                End every session on other devices. This workstation stays signed in.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 font-mono text-[11px] text-muted-foreground">
                <span>Scope: all other sessions</span>
                <span>Invalidation: immediate</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRevokeAllOtherSessions}
            disabled={revokingAll}
            className="h-9 shrink-0 rounded-md border-border bg-transparent px-3.5 text-sm font-medium text-destructive hover:border-destructive/40 hover:bg-destructive/[0.04]"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            <span>{revokingAll ? "Ending other sessions" : "Sign out everywhere else"}</span>
          </Button>
        </section>
      </div>

    </div>
  );
}
