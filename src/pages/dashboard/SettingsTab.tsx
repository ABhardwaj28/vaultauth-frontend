import { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsTab() {
  const { user, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Account & Security Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your authentication credentials, multi-factor security, and interface preferences.
          </p>
        </div>
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Change Password Form */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                Credentials
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Authentication Secret
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Change Password
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Update your corporate access credentials (minimum 12 characters).
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs mt-5 pt-4 border-t border-border/60">
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs font-medium text-foreground">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-10 text-xs pr-9 rounded-lg border-border/80 bg-background/50 focus:bg-background"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-medium text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    className="h-10 text-xs pr-9 rounded-lg border-border/80 bg-background/50 focus:bg-background"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Minimum 12 characters, maximum 128 characters.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-10 text-xs pr-9 rounded-lg border-border/80 bg-background/50 focus:bg-background"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full h-10 text-xs font-semibold rounded-lg mt-2 shadow-xs"
              >
                {updatingPassword ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Updating Credentials...</span>
                  </span>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-5">
          {/* Card 2: Two-Factor Authentication Status */}
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="success" className="font-mono text-[10px] uppercase">
                Enforced
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secondary Verification
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Multi-Factor Authentication (MFA)
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Out-of-band verification required for all corporate logins.
              </p>
            </div>

            <div className="mt-5 space-y-3 pt-4 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Challenge Mode</span>
                <span className="text-foreground font-medium">Email Challenge (OTP)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Delivery Channel</span>
                <span className="text-foreground font-mono truncate max-w-[200px]">
                  {user?.email || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-medium">Policy Status</span>
                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mandatory Policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Theme & Display Preferences */}
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Sun className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                Interface
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Display Styling
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Theme Preference
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/80 bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Sun className="h-4 w-4 mb-1.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/80 bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Moon className="h-4 w-4 mb-1.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border/80 bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Monitor className="h-4 w-4 mb-1.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Card 4: Emergency Device Control (Danger Zone) */}
          <div className="relative overflow-hidden rounded-xl border border-destructive/30 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-destructive/[0.035] before:via-transparent before:to-transparent before:pointer-events-none transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0 shadow-xs">
                <Laptop className="w-5 h-5 text-destructive" />
              </div>
              <Badge variant="destructive" className="font-mono text-[10px] uppercase">
                Danger Zone
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                Emergency Control
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Revoke Other Workstations
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Terminate all other authenticated sessions across external devices. Your current session will remain active.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                onClick={handleRevokeAllOtherSessions}
                disabled={revokingAll}
                className="w-full h-10 text-xs font-semibold rounded-lg shadow-xs"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{revokingAll ? "Terminating other sessions..." : "Sign Out From All Other Devices"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
