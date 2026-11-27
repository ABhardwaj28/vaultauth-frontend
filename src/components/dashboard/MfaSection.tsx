import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OtpInput } from "@/components/ui/otp-input";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Factor = "otp" | "totp";
type SetupStep = "choose" | "authenticator" | "done";
type PendingChange = { target: Factor | "all"; enabled: boolean } | null;

const FACTORS: Factor[] = ["otp", "totp"];
const FACTOR_LABELS: Record<Factor, string> = {
  otp: "Email OTP",
  totp: "Authenticator (TOTP)",
};
const FACTOR_HINTS: Record<Factor, string> = {
  otp: "A six-digit code delivered to your inbox at sign-in.",
  totp: "Scan a QR code and use codes that refresh every 30 seconds.",
};

export function MfaSection() {
  const { user, refreshProfile } = useAuth();

  // Server-backed source of truth. Only enrolled factors show as active.
  const otpEnabled = Boolean(user?.otp_enabled);
  const totpEnabled = Boolean(user?.totp_enabled);
  const mfaActive = otpEnabled || totpEnabled;

  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // First-time setup / adding the authenticator factor
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("choose");
  const [setupChoice, setSetupChoice] = useState<Factor[]>([]);
  const [setupPassword, setSetupPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Password confirmation for toggling a factor
  const [pending, setPending] = useState<PendingChange>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!setupUri) {
      setQrDataUrl(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(setupUri, {
      width: 192,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [setupUri]);

  const message = (err: unknown, fallback: string) =>
    (err as { message?: string })?.message || fallback;

  const isPasswordError = (err: unknown) => {
    const apiErr = err as ApiError;
    return (
      apiErr?.status === 401 ||
      apiErr?.code === "ERR_INVALID_CREDENTIALS" ||
      apiErr?.code === "ERR_INVALID_PASSWORD"
    );
  };

  const describeError = (err: unknown, fallback: string) =>
    isPasswordError(err) ? "Incorrect password. Try again." : message(err, fallback);

  const closeSetup = () => {
    setSetupOpen(false);
    setSetupStep("choose");
    setSetupChoice([]);
    setSetupPassword("");
    setVerifyCode("");
    setSetupUri(null);
    setQrDataUrl(null);
    setError(null);
  };

  const openPasswordConfirm = (target: Factor | "all", enabled: boolean) => {
    setPending({ target, enabled });
    setConfirmPassword("");
    setShowConfirmPassword(false);
    setConfirmError(null);
    setNotice(null);
    setError(null);
  };

  const handleMasterToggle = (checked: boolean) => {
    setNotice(null);
    setError(null);
    if (checked) {
      if (!mfaActive) {
        setSetupChoice([]);
        setSetupStep("choose");
        setSetupPassword("");
        setSetupOpen(true);
      }
      return;
    }
    if (mfaActive) openPasswordConfirm("all", false);
  };

  const toggleSetupChoice = (factor: Factor) => {
    setSetupChoice((current) =>
      current.includes(factor) ? current.filter((item) => item !== factor) : [...current, factor]
    );
  };

  const startAuthenticator = async (password: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.totpEnroll(password);
      setSetupUri(res.otpauth_uri);
      setVerifyCode("");
      setSetupStep("authenticator");
      setSetupOpen(true);
      setNotice("Scan the QR code, then enter the 6-digit code to activate your authenticator.");
    } catch (err: unknown) {
      setError(describeError(err, "Unable to start authenticator enrollment."));
      setSetupOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const handleSetupContinue = async () => {
    if (setupChoice.length === 0) {
      setError("Choose at least one verification method.");
      return;
    }
    if (!setupPassword) {
      setError("Enter your password to activate the selected method(s).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (setupChoice.includes("otp")) {
        await api.setOwnOtp(true, setupPassword);
        setNotice("Email OTP activated.");
      }
      if (setupChoice.includes("totp")) {
        await startAuthenticator(setupPassword);
        await refreshProfile();
        return;
      }
      await refreshProfile();
      closeSetup();
    } catch (err: unknown) {
      setError(describeError(err, "Unable to activate the selected method."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!/^\d{6}$/.test(verifyCode)) {
      setError("Enter the 6-digit code shown by your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.totpConfirm(setupPassword, verifyCode);
      setRecoveryCodes(res.recovery_codes);
      setVerifyCode("");
      setSetupStep("done");
      setNotice("Authenticator activated. Save your recovery codes now.");
      await refreshProfile();
    } catch (err: unknown) {
      setError(describeError(err, "The code could not be verified. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmPending = async () => {
    if (!pending) return;
    if (!confirmPassword.trim()) {
      setConfirmError("Enter your account password to continue.");
      return;
    }
    setBusy(true);
    setConfirmError(null);
    try {
      const { target, enabled } = pending;
      if (target === "all") {
        if (otpEnabled) await api.setOwnOtp(false, confirmPassword);
        if (totpEnabled) await api.totpDisable({ password: confirmPassword, code: null });
        setNotice("MFA turned off. Choose a method again to turn it on.");
      } else if (target === "otp") {
        await api.setOwnOtp(enabled, confirmPassword);
        setNotice(`Email OTP ${enabled ? "enabled" : "turned off"}.`);
      } else if (enabled) {
        setSetupChoice(["totp"]);
        setSetupPassword(confirmPassword);
        setPending(null);
        setBusy(false);
        await startAuthenticator(confirmPassword);
        return;
      } else {
        await api.totpDisable({ password: confirmPassword, code: null });
        setNotice("Authenticator turned off.");
      }
      await refreshProfile();
      setExpanded(true);
      setPending(null);
    } catch (err: unknown) {
      const text = describeError(err, "Unable to update this MFA method.");
      setConfirmError(text);
    } finally {
      setBusy(false);
    }
  };

  const downloadRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    const content = [
      "VaultAuth SSO — TOTP recovery codes",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...recoveryCodes.map((code, index) => `${String(index + 1).padStart(2, "0")}. ${code}`),
      "",
      "Each code can be used once. Store this file somewhere safe.",
      "",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vaultauth-recovery-codes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex max-w-md flex-1 items-start gap-3 rounded-md text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 space-y-1.5">
            <span className="flex items-center gap-2">
              <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                MFA
              </span>
              <span className={cn("text-[12px] font-medium", mfaActive ? "text-success" : "text-muted-foreground")}>
                {mfaActive ? "On" : "Off"}
              </span>
            </span>
            <span className="block text-sm leading-relaxed text-muted-foreground">
              Add a second check at sign-in. Nothing is enabled until you choose a method.
            </span>
          </span>
          <ChevronDown
            className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        </button>
        <Switch
          checked={mfaActive}
          onCheckedChange={handleMasterToggle}
          aria-label="Enable MFA"
        />
      </div>

      {expanded && (
        <div className="mt-5 max-w-xl overflow-hidden rounded-md border border-border/70 bg-background/50">
          {FACTORS.map((factor, index) => {
            const enrolled = factor === "otp" ? otpEnabled : totpEnabled;
            return (
              <div
                key={factor}
                className={cn("flex items-center gap-3 px-3.5 py-3", index > 0 && "border-t border-border/60")}
              >
                <span className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                  enrolled
                    ? "border-primary/40 bg-primary/[0.07] text-primary"
                    : "border-border/70 bg-muted/40 text-muted-foreground"
                )}>
                  {factor === "otp" ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[13px] font-medium text-foreground">{FACTOR_LABELS[factor]}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{FACTOR_HINTS[factor]}</p>
                </div>
                <Switch
                  checked={enrolled}
                  disabled={busy}
                  onCheckedChange={(checked) => openPasswordConfirm(factor, checked)}
                  aria-label={`${FACTOR_LABELS[factor]}`}
                />
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-3.5 py-2.5 text-[12px]">
            <span className="text-muted-foreground">Policy</span>
            <span className="font-medium text-foreground">
              {user?.mfa_enforced ? "Enforced by administrator" : "Optional for this account"}
            </span>
          </div>
        </div>
      )}

      {!mfaActive && !expanded && (
        <div className="mt-4 flex max-w-xl flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">No second factor yet. Turn on MFA to choose one.</p>
          <Button
            type="button"
            onClick={() => {
              setExpanded(true);
              setSetupChoice([]);
              setSetupStep("choose");
              setSetupPassword("");
              setSetupOpen(true);
            }}
            className="h-9"
          >
            Set up MFA
          </Button>
        </div>
      )}

      {notice && (
        <p className="mt-4 flex max-w-xl items-start gap-2 text-[13px] text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <span>{notice}</span>
        </p>
      )}
      {error && (
        <p className="mt-4 flex max-w-xl items-start gap-2 text-[13px] text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Password confirmation for a factor edit */}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => { if (!open && !busy) setPending(null); }}
      >
        <DialogContent className="rounded-md sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Confirm your password
            </DialogTitle>
            <DialogDescription>
              Enter your password to {pending?.target === "all"
                ? "turn off MFA"
                : pending?.target === "otp"
                ? (pending.enabled ? "enable email OTP" : "turn off email OTP")
                : pending?.enabled
                ? "set up your authenticator"
                : "turn off the authenticator"}. This only confirms the change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="mfa-confirm-password" className="text-[13px]">Current password</Label>
            <div className="relative">
              <Input
                id="mfa-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                placeholder="Enter your password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setConfirmError(null);
                }}
                onKeyDown={(event) => { if (event.key === "Enter") handleConfirmPending(); }}
                className="h-10 pr-9"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmError && (
              <p className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {confirmError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={() => setPending(null)} disabled={busy} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmPending} disabled={busy || !confirmPassword} className="h-9">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* First activation / adding the authenticator */}
      <Dialog open={setupOpen} onOpenChange={(open) => { if (!open) closeSetup(); }}>
        <DialogContent className="rounded-md sm:max-w-md">
          {setupStep === "choose" && (
            <>
              <DialogHeader>
                <DialogTitle>Set up MFA</DialogTitle>
                <DialogDescription>
                  Choose one verification method, or activate both. Only enrolled methods appear at sign-in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {FACTORS.map((factor) => (
                  <button
                    key={factor}
                    type="button"
                    aria-pressed={setupChoice.includes(factor)}
                    onClick={() => toggleSetupChoice(factor)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border p-3.5 text-left transition-colors",
                      setupChoice.includes(factor)
                        ? "border-primary bg-primary/[0.05]"
                        : "border-border/70 bg-background/50 hover:border-primary/40"
                    )}
                  >
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      setupChoice.includes(factor)
                        ? "bg-[#F07A26] text-white"
                        : "border border-border/70 bg-muted/40 text-muted-foreground"
                    )}>
                      {factor === "otp" ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-[13px] font-semibold text-foreground">{FACTOR_LABELS[factor]}</span>
                      <span className="block text-[12px] text-muted-foreground">{FACTOR_HINTS[factor]}</span>
                    </span>
                    <span className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      setupChoice.includes(factor) ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}>
                      {setupChoice.includes(factor) && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-password" className="text-[13px]">Confirm your password</Label>
                <Input
                  id="setup-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={setupPassword}
                  onChange={(event) => setSetupPassword(event.target.value)}
                  className="h-10"
                />
              </div>
              {error && (
                <p className="flex items-center gap-2 text-[12px] text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" onClick={closeSetup} className="h-9">Cancel</Button>
                <Button type="button" onClick={handleSetupContinue} disabled={busy || setupChoice.length === 0 || !setupPassword} className="h-9">
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                </Button>
              </div>
            </>
          )}

          {setupStep === "authenticator" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep("choose")}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Back to method selection"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  Set up your authenticator
                </DialogTitle>
                <DialogDescription>
                  Scan the QR code, then enter the 6-digit code it shows to activate this method.
                </DialogDescription>
              </DialogHeader>
              <div className="flex w-full min-w-0 flex-col items-center gap-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Authenticator setup QR code" className="h-48 w-48 rounded-md border border-border bg-white p-2" />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-md border border-border bg-muted/40 text-[12px] text-muted-foreground">
                    Generating QR…
                  </div>
                )}
                {setupUri && (
                  <div className="flex w-full items-center gap-2">
                    <code
                      className="block min-w-0 flex-1 truncate rounded border border-border/70 bg-muted/30 px-2 py-1.5 text-left font-mono text-[10px] text-muted-foreground"
                      title={setupUri}
                    >
                      {setupUri}
                    </code>
                    <CopyButton value={setupUri} className="h-7 shrink-0 rounded px-2 text-[10px]" />
                  </div>
                )}
                <p className="w-full text-[11px] text-muted-foreground">
                  Can&rsquo;t scan? Copy the setup key above into your authenticator app.
                </p>
                <div className="w-full space-y-2 border-t border-border/60 pt-4">
                  <Label className="block text-center text-[13px]">Verification code</Label>
                  <OtpInput value={verifyCode} onChange={setVerifyCode} />
                  {notice && (
                    <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" /> {notice}
                    </p>
                  )}
                  {error && (
                    <p className="flex items-center justify-center gap-1.5 text-[12px] text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" /> {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={closeSetup} className="h-9">Cancel</Button>
                    <Button type="button" onClick={handleVerifyAuthenticator} disabled={busy || verifyCode.length !== 6} className="h-9">
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Verify &amp; activate
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {setupStep === "done" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  MFA is active
                </DialogTitle>
                <DialogDescription>Save your recovery codes now — they won&rsquo;t be shown again.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {recoveryCodes.map((code) => (
                  <div key={code} className="flex items-center justify-between gap-2 rounded border border-border/70 bg-muted/30 px-2.5 py-1.5">
                    <code className="font-mono text-[12px] text-foreground">{code}</code>
                    <CopyButton value={code} className="h-6 rounded px-1.5 text-[10px]" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button type="button" onClick={downloadRecoveryCodes} className="h-9">
                  <Download className="mr-2 h-3.5 w-3.5" /> Download .txt
                </Button>
                <Button type="button" onClick={closeSetup} className="h-9">Done</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
