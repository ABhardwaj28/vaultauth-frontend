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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      setPasswordError("New password must be at least 12 characters in compliance with NIST SP 800-63B.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Account & Security Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your authentication credentials, multi-factor policy, and interface preferences.
          </p>
        </div>
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Change Password Form */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Change Password
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Update your corporate credentials per NIST SP 800-63B guidelines (minimum 12 characters).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              {passwordSuccess && (
                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-xs">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-8 text-xs pr-8"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-password" className="text-xs">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    className="h-8 text-xs pr-8"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Must be at least 12 characters and hashed server-side with Argon2id.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-xs">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-8 text-xs pr-8"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full h-8 text-xs font-medium mt-2"
              >
                {updatingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card 2: Two-Factor Authentication Status */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Multi-Factor Authentication (MFA)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Secondary out-of-band challenge required for every authentication request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <span className="font-medium text-foreground block">Email OTP Verification</span>
                <span className="text-[11px] text-muted-foreground">6-digit cryptographic challenge via Resend</span>
              </div>
              <Badge variant="success" className="text-[11px]">
                ENFORCED
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <span className="font-medium text-foreground block">Destination Channel</span>
                <span className="text-[11px] text-muted-foreground">Verified corporate email address</span>
              </div>
              <span className="font-mono text-[11px] text-foreground">
                {user?.email || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Theme & Display Preferences */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Display & Theme Preference
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              High-contrast surfaces with amber accent in Light and Dark modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Sun className="h-4 w-4 mb-1.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Moon className="h-4 w-4 mb-1.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-medium transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Monitor className="h-4 w-4 mb-1.5" />
                <span>System</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Emergency Device Control (Danger Zone) */}
        <Card className="border-border border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Laptop className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Workstation & Session Governance
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Emergency kill-switch to invalidate sessions across other hardware.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-muted-foreground text-xs leading-relaxed">
              If you suspect an active session or token has been compromised on another device, terminate all other active sessions immediately. Your current browser session will remain active.
            </p>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokingAll}
              className="w-full h-8 text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>{revokingAll ? "Terminating other sessions..." : "Sign Out From All Other Devices"}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
