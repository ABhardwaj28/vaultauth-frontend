import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Clock,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";

export function SettingsTab() {
  const { user, refreshProfile } = useAuth();
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

  // Two-factor control state — backed by POST /api/v1/me/2fa
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const twoFactorEnabled = Boolean(user?.two_factor_enabled ?? user?.totp_enabled);
  const twoFactorEnforced = Boolean(user?.two_factor_enforced);
  const totpEnabled = Boolean(user?.totp_enabled);

  // Authenticator app (TOTP) enrollment — /api/v1/me/totp/*
  const [totpPassword, setTotpPassword] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [totpBusy, setTotpBusy] = useState<"enroll" | "confirm" | "disable" | "regenerate" | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpNotice, setTotpNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!totpUri) {
      setQrDataUrl(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(totpUri, {
      width: 176,
      margin: 1,
      color: { dark: "#0F1015", light: "#FFFFFF" },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [totpUri]);

  const handleToggleTwoFactor = async (enabled: boolean) => {
    setTwoFactorMessage(null);
    setTwoFactorError(null);
    if (!twoFactorPassword) {
      setTwoFactorError("Enter your password to change this setting.");
      return;
    }

    setUpdatingTwoFactor(true);
    try {
      const res = await api.setOwn2FA(enabled, twoFactorPassword);
      setTwoFactorMessage(res.message || (enabled ? "Two-factor authentication enabled." : "Two-factor authentication disabled."));
      setTwoFactorPassword("");
      await refreshProfile();
    } catch (err: unknown) {
      setTwoFactorError((err as { message?: string })?.message || "Unable to update two-factor authentication.");
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  const handleTotpEnroll = async () => {
    if (!totpPassword) {
      setTotpError("Enter your password to start authenticator setup.");
      return;
    }
    setTotpBusy("enroll");
    setTotpError(null);
    setTotpNotice(null);
    setRecoveryCodes([]);
    try {
      const res = await api.totpEnroll(totpPassword);
      setTotpUri(res.otpauth_uri);
      setTotpCode("");
      setTotpNotice(res.message || "Scan the QR code with your authenticator app, then confirm with a code.");
    } catch (err: unknown) {
      setTotpError((err as { message?: string })?.message || "Unable to start authenticator enrollment.");
    } finally {
      setTotpBusy(null);
    }
  };

  const handleTotpConfirm = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      setTotpError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTotpBusy("confirm");
    setTotpError(null);
    try {
      const res = await api.totpConfirm(totpPassword, totpCode);
      setRecoveryCodes(res.recovery_codes);
      setTotpUri(null);
      setTotpCode("");
      setTotpPassword("");
      setTotpNotice(res.message || "Authenticator app enabled. Store your recovery codes now.");
      await refreshProfile();
    } catch (err: unknown) {
      setTotpError((err as { message?: string })?.message || "The code could not be verified. Try again.");
    } finally {
      setTotpBusy(null);
    }
  };

  const handleTotpDisable = async () => {
    if (!totpPassword && !disableCode.trim()) {
      setTotpError("Enter your password or a current authenticator / recovery code.");
      return;
    }
    setTotpBusy("disable");
    setTotpError(null);
    setTotpNotice(null);
    try {
      const res = await api.totpDisable({
        password: totpPassword || null,
        code: disableCode.trim() || null,
      });
      setTotpNotice(res.message || "Authenticator app disabled.");
      setDisableCode("");
      setTotpPassword("");
      setRecoveryCodes([]);
      await refreshProfile();
    } catch (err: unknown) {
      setTotpError((err as { message?: string })?.message || "Unable to disable the authenticator app.");
    } finally {
      setTotpBusy(null);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!totpPassword) {
      setTotpError("Enter your password to regenerate recovery codes.");
      return;
    }
    setTotpBusy("regenerate");
    setTotpError(null);
    try {
      const res = await api.regenerateRecoveryCodes(totpPassword);
      setRecoveryCodes(res.recovery_codes);
      setTotpNotice(res.message || "New recovery codes generated. The old codes no longer work.");
    } catch (err: unknown) {
      setTotpError((err as { message?: string })?.message || "Unable to regenerate recovery codes.");
    } finally {
      setTotpBusy(null);
    }
  };

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

        {/* Verification */}
        <section className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                Two-factor authentication
              </h2>
              <p className="text-sm text-muted-foreground">
                Out-of-band verification required for every corporate sign-in.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${twoFactorEnabled ? "bg-success" : "bg-warning"}`} />
              {twoFactorEnabled ? twoFactorEnforced ? "Enforced" : "Enabled" : "Not enabled"}
            </span>
          </div>

          <div className="mt-5 max-w-xl divide-y divide-border/60 rounded-md border border-border/70 bg-background/50 px-3.5 text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Challenge mode
              </span>
              <span className="text-right font-medium text-foreground">Email code</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-muted-foreground">Delivery address</span>
              <span className="max-w-[180px] truncate font-mono text-[13px] text-foreground" title={user?.email || ""}>
                {user?.email || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Code validity
              </span>
              <span className="font-mono text-[13px] text-foreground">10 minutes</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-muted-foreground">Policy</span>
              <span className="flex items-center gap-1.5 text-foreground">
                {twoFactorEnabled ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                )}
                <span className="text-[13px]">
                  {twoFactorEnabled ? twoFactorEnforced ? "Mandatory" : "Active" : "Off"}
                </span>
              </span>
            </div>
          </div>

          {twoFactorMessage && (
            <p className="mt-4 max-w-xl text-[13px] text-success">{twoFactorMessage}</p>
          )}
          {twoFactorError && (
            <p className="mt-4 max-w-xl text-[13px] text-destructive">{twoFactorError}</p>
          )}

          <div className="mt-5 max-w-xl space-y-3 border-t border-border/60 pt-4">
            <Label htmlFor="two-factor-password" className="text-sm">Confirm your password</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="two-factor-password"
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                value={twoFactorPassword}
                onChange={(e) => {
                  setTwoFactorPassword(e.target.value);
                  setTwoFactorError(null);
                }}
                className="h-10 flex-1"
                disabled={updatingTwoFactor}
              />
              <Button
                type="button"
                variant={twoFactorEnabled ? "outline" : "default"}
                onClick={() => handleToggleTwoFactor(!twoFactorEnabled)}
                disabled={updatingTwoFactor || !twoFactorPassword}
                className="h-10"
              >
                {updatingTwoFactor ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                ) : twoFactorEnabled ? (
                  "Turn off two-factor"
                ) : (
                  "Turn on two-factor"
                )}
              </Button>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              When enabled, a single-use code is sent to your email after password verification. Your next sign-in will open the code screen.
            </p>
          </div>
        </section>

        {/* Authenticator app (TOTP) */}
        <section className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                Authenticator app
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional TOTP second factor. Codes refresh every 30 seconds and work offline.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${totpEnabled ? "bg-success" : "bg-muted-foreground/40"}`} />
              {totpEnabled ? "Enrolled" : "Not enrolled"}
            </span>
          </div>

          {totpNotice && (
            <p className="mt-4 flex items-center gap-2 text-[13px] text-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {totpNotice}
            </p>
          )}
          {totpError && (
            <p className="mt-4 flex items-center gap-2 text-[13px] text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {totpError}
            </p>
          )}

          <div className="mt-5 max-w-xl space-y-4 border-t border-border/60 pt-4">
            {!totpEnabled ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="totp-password" className="text-sm">Confirm your password</Label>
                  <Input
                    id="totp-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Current password"
                    value={totpPassword}
                    onChange={(e) => {
                      setTotpPassword(e.target.value);
                      setTotpError(null);
                    }}
                    className="h-10"
                    disabled={totpBusy !== null}
                  />
                </div>

                {!totpUri ? (
                  <Button type="button" onClick={handleTotpEnroll} disabled={totpBusy !== null || !totpPassword} className="h-9">
                    {totpBusy === "enroll" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting setup…</>
                    ) : (
                      <><Smartphone className="mr-2 h-4 w-4" /> Set up authenticator</>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4 rounded-md border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="Authenticator setup QR code" className="h-32 w-32 shrink-0 rounded border border-border bg-white p-1" />
                      ) : (
                        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded border border-border bg-muted/40 text-[11px] text-muted-foreground">
                          Generating QR…
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-[13px] leading-relaxed text-foreground">
                          Scan this with Google Authenticator, 1Password, Authy or any TOTP app.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="min-w-0 flex-1 truncate rounded border border-border/70 bg-card px-2 py-1.5 font-mono text-[10px] text-muted-foreground" title={totpUri}>
                            {totpUri}
                          </code>
                          <CopyButton value={totpUri} className="h-7 shrink-0 rounded px-2 text-[10px]" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Can&rsquo;t scan? Paste the setup key above into your app manually.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t border-border/60 pt-3">
                      <Label htmlFor="totp-code" className="text-[13px]">Confirmation code</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="totp-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={totpCode}
                          onChange={(e) => {
                            setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setTotpError(null);
                          }}
                          className="h-10 flex-1 font-mono tracking-widest"
                          disabled={totpBusy !== null}
                        />
                        <Button type="button" onClick={handleTotpConfirm} disabled={totpBusy !== null || totpCode.length !== 6} className="h-10">
                          {totpBusy === "confirm" ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…</>
                          ) : (
                            "Confirm & enable"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[13px] text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Codes from your authenticator app are accepted at sign-in alongside email OTP.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totp-disable-code" className="text-[13px]">Current code or recovery code (optional)</Label>
                  <Input
                    id="totp-disable-code"
                    placeholder="Leave blank to use your password"
                    value={disableCode}
                    onChange={(e) => {
                      setDisableCode(e.target.value);
                      setTotpError(null);
                    }}
                    className="h-10 font-mono"
                    disabled={totpBusy !== null}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleTotpDisable} disabled={totpBusy !== null} className="h-9">
                    {totpBusy === "disable" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Disable authenticator
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRegenerateRecoveryCodes} disabled={totpBusy !== null || !totpPassword} className="h-9">
                    {totpBusy === "regenerate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    Regenerate recovery codes
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Regenerating requires your password entered above. Old recovery codes stop working immediately.
                </p>
              </>
            )}

            {recoveryCodes.length > 0 && (
              <div className="rounded-md border border-primary/30 bg-primary/[0.04] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-foreground">Save your recovery codes</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRecoveryCodes([])} className="h-7 text-[11px]">
                    I&rsquo;ve saved them
                  </Button>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  Each code works once. They are shown only now — store them somewhere safe.
                </p>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {recoveryCodes.map((code) => (
                    <div key={code} className="flex items-center justify-between gap-2 rounded border border-border/70 bg-card px-2.5 py-1.5">
                      <code className="font-mono text-[12px] text-foreground">{code}</code>
                      <CopyButton value={code} className="h-6 rounded px-1.5 text-[10px]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

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
