import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OtpInput } from "@/components/ui/otp-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** UI-only 2FA control. Endpoint wiring is intentionally deferred until the
 *  canonical `/api/v1/auth/mfa/*`, `/api/v1/auth/otp/*` and `/api/v1/me/otp`
 *  contracts are available. */
type Factor = "otp" | "totp";
type SetupStep = "choose" | "authenticator" | "done";

const FACTORS: Factor[] = ["otp", "totp"];
const FACTOR_LABELS: Record<Factor, string> = {
  otp: "Email OTP",
  totp: "Authenticator (TOTP)",
};
const FACTOR_HINTS: Record<Factor, string> = {
  otp: "A six-digit code delivered to your inbox at sign-in.",
  totp: "Scan a QR code and use codes that refresh every 30 seconds.",
};
const storageKey = (userId?: string) => `vaultauth_ui_mfa_factors${userId ? `:${userId}` : ""}`;

export function TwoFactorSection() {
  const { user } = useAuth();

  // Activated factors are local-only until the new MFA endpoints ship.
  const [factors, setFactors] = useState<Factor[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  // First-time setup dialog (choose one factor or both).
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("choose");
  const [setupChoice, setSetupChoice] = useState<Factor[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Inline password gate: unlocks only the method dropdown and its actions.
  const [passwordRequested, setPasswordRequested] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let initial: Factor[] = [];
    try {
      const stored = localStorage.getItem(storageKey(user?.id));
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initial = parsed.filter((item): item is Factor => item === "otp" || item === "totp");
        }
      } else {
        // Existing accounts start from their current server-backed flags.
        if (user?.two_factor_enabled) initial.push("otp");
        if (user?.totp_enabled) initial.push("totp");
      }
    } catch {
      // Ignore malformed local state and fall back to a clean slate.
    }
    setFactors(initial);
    setInitialized(true);
  }, [user?.id]);

  useEffect(() => {
    if (initialized && user?.id) {
      localStorage.setItem(storageKey(user.id), JSON.stringify(factors));
    }
  }, [factors, initialized, user?.id]);

  // Preview QR for the authenticator step. Replace with
  // POST /api/v1/me/totp/enroll when the new contract is available.
  useEffect(() => {
    if (setupStep !== "authenticator") return;
    let active = true;
    const secret = "JBSWY3DPEHPK3PXP";
    const uri = `otpauth://totp/VaultAuth:${encodeURIComponent(user?.email ?? "account")}?secret=${secret}&issuer=VaultAuth`;
    setSetupUri(uri);
    QRCode.toDataURL(uri, {
      width: 168,
      margin: 1,
      color: { dark: "#0F1015", light: "#FFFFFF" },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [setupStep, user?.email]);

  const mfaActive = factors.length > 0;
  const activeMethods = factors.length
    ? factors.map((factor) => FACTOR_LABELS[factor]).join(" · ")
    : "None";

  const closeSetup = () => {
    setSetupOpen(false);
    setSetupStep("choose");
    setSetupChoice([]);
    setVerifyCode("");
    setQrDataUrl(null);
    setSetupUri(null);
  };

  const handleSwitchChange = (checked: boolean) => {
    setNotice(null);
    if (checked) {
      if (!mfaActive) {
        setSetupChoice([]);
        setSetupStep("choose");
        setVerifyCode("");
        setSetupOpen(true);
      }
      return;
    }
    if (!mfaActive) return;
    // Turning an active setup off requires a password confirmation first.
    setPassword("");
    setPasswordError(null);
    setShowPassword(false);
    setUnlocked(false);
    setMenuOpen(false);
    setPasswordRequested(true);
  };

  const toggleSetupChoice = (factor: Factor) => {
    setSetupChoice((current) =>
      current.includes(factor) ? current.filter((item) => item !== factor) : [...current, factor]
    );
  };

  const handleSetupContinue = () => {
    if (setupChoice.length === 0) return;

    if (setupChoice.includes("otp")) {
      setFactors((current) => (current.includes("otp") ? current : [...current, "otp"]));
    }

    if (setupChoice.includes("totp")) {
      setSetupStep("authenticator");
      setVerifyCode("");
      setQrDataUrl(null);
      setNotice("Scan the QR code, then enter the 6-digit code to activate your authenticator.");
      return;
    }

    closeSetup();
    setUnlocked(false);
    setNotice("2FA is on. Email OTP will be requested at sign-in.");
  };

  const handleVerifyAuthenticator = () => {
    if (!/^\d{6}$/.test(verifyCode)) {
      setNotice("Enter the 6-digit code shown by your authenticator app.");
      return;
    }
    setFactors((current) => (current.includes("totp") ? current : [...current, "totp"]));
    setVerifyCode("");
    setSetupStep("done");
    setNotice("Authenticator activated. Your selected methods are now active.");
  };

  const handleConfirmPassword = () => {
    if (!password.trim()) {
      setPasswordError("Enter your account password to continue.");
      return;
    }
    // TODO: verify with the canonical password endpoint once the MFA contract lands.
    setPasswordError(null);
    setUnlocked(true);
    setPasswordRequested(false);
    setPassword("");
    setNotice("Password confirmed. Method controls are unlocked for this session.");
    setMenuOpen(true);
  };

  const handleFactorToggle = (factor: Factor, checked: boolean) => {
    if (!unlocked) return;

    if (checked) {
      if (factor === "totp" && !factors.includes("totp")) {
        setSetupChoice(["totp"]);
        setSetupStep("authenticator");
        setVerifyCode("");
        setMenuOpen(false);
        setSetupOpen(true);
        return;
      }
      setFactors((current) => (current.includes("otp") ? current : [...current, "otp"]));
      setNotice("Email OTP activated.");
      return;
    }

    const next = factors.filter((item) => item !== factor);
    setFactors(next);
    if (next.length === 0) {
      setUnlocked(false);
      setMenuOpen(false);
      setNotice("2FA turned off. Method controls are locked.");
    } else {
      setNotice(`${FACTOR_LABELS[factor]} turned off.`);
    }
  };

  const handleTurnOffAll = () => {
    setFactors([]);
    setUnlocked(false);
    setMenuOpen(false);
    setNotice("2FA turned off. Toggle the switch on to set it up again.");
  };

  return (
    <section className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
            2FA
          </h2>
          <p className="text-sm text-muted-foreground">
            Second-factor verification required at sign-in. Off by default until you activate it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", mfaActive ? "bg-success" : "bg-warning")} />
            {mfaActive ? "On" : "Off"}
          </span>
          <Switch
            checked={mfaActive}
            onCheckedChange={handleSwitchChange}
            aria-label="Enable two-factor authentication"
          />
        </div>
      </div>

      <div className="mt-5 max-w-xl divide-y divide-border/60 rounded-md border border-border/70 bg-background/50 px-3.5 text-sm">
        <div className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium text-foreground">{mfaActive ? "Active" : "Not enabled"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-muted-foreground">Active methods</span>
          <span className="max-w-[240px] truncate text-right font-mono text-[12px] text-foreground" title={activeMethods}>
            {activeMethods}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-muted-foreground">Delivery</span>
          <span className="max-w-[220px] truncate font-mono text-[12px] text-foreground" title={user?.email || ""}>
            {user?.email || "—"}
          </span>
        </div>
      </div>

      {notice && (
        <p className="mt-4 flex max-w-xl items-start gap-2 text-[13px] text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <span>{notice}</span>
        </p>
      )}

      <div className="mt-5 max-w-xl space-y-3 border-t border-border/60 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-foreground">Manage methods</p>
            <p className="text-[11px] leading-4 text-muted-foreground">
              {!mfaActive
                ? "2FA is off. Toggle it on to choose your verification methods."
                : !unlocked
                ? "Confirm your password to unlock the active-method controls."
                : "Password confirmed. Method controls are unlocked for this session."}
            </p>
          </div>
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => { if (unlocked && mfaActive) setMenuOpen(open); }}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={!unlocked || !mfaActive}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
                  !unlocked || !mfaActive
                    ? "cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground"
                    : "border-border/70 bg-background/60 text-foreground hover:bg-muted/40"
                )}
              >
                Active methods
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Activated methods</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FACTORS.map((factor) => (
                <DropdownMenuCheckboxItem
                  key={factor}
                  checked={factors.includes(factor)}
                  disabled={!unlocked}
                  onCheckedChange={(checked) => handleFactorToggle(factor, checked)}
                  onSelect={(event) => event.preventDefault()}
                >
                  <span className="flex items-center gap-2">
                    {factor === "otp" ? <Mail className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                    {FACTOR_LABELS[factor]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!unlocked}
                onSelect={handleTurnOffAll}
                className="text-destructive focus:text-destructive"
              >
                <ShieldOff className="mr-2 h-3.5 w-3.5" />
                Turn off 2FA
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {mfaActive && !unlocked && (
          <div className="space-y-2 rounded-md border border-border/70 bg-background/40 p-3">
            <Label htmlFor="mfa-password" className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Confirm your password to manage methods
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="mfa-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={password}
                  autoFocus={passwordRequested}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError(null);
                  }}
                  onKeyDown={(event) => { if (event.key === "Enter") handleConfirmPassword(); }}
                  className="h-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" onClick={handleConfirmPassword} disabled={!password} className="h-9">
                Unlock
              </Button>
            </div>
            {passwordError && (
              <p className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {passwordError}
              </p>
            )}
            <p className="text-[11px] leading-4 text-muted-foreground">
              Your password only unlocks this menu and the controls inside it.
            </p>
          </div>
        )}
      </div>

      {/* First activation: choose one method, or both. */}
      <Dialog open={setupOpen} onOpenChange={(open) => { if (!open) closeSetup(); }}>
        <DialogContent className="rounded-md sm:max-w-md">
          {setupStep === "choose" && (
            <>
              <DialogHeader>
                <DialogTitle>Set up two-factor authentication</DialogTitle>
                <DialogDescription>
                  Choose one verification method, or activate both. You can change this later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {FACTORS.map((factor) => {
                  const selected = setupChoice.includes(factor);
                  return (
                    <button
                      key={factor}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleSetupChoice(factor)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/[0.05]"
                          : "border-border/70 bg-background/50 hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                          selected
                            ? "bg-[#F07A26] text-white"
                            : "border border-border/70 bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {factor === "otp" ? <Mail className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="block text-[13px] font-semibold text-foreground">
                          {FACTOR_LABELS[factor]}
                        </span>
                        <span className="block text-[12px] text-muted-foreground">{FACTOR_HINTS[factor]}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" onClick={closeSetup} className="h-9">
                  Cancel
                </Button>
                <Button type="button" onClick={handleSetupContinue} disabled={setupChoice.length === 0} className="h-9">
                  Continue
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                UI preview — activation will connect to the new MFA endpoints when they ship.
              </p>
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
                  <img
                    src={qrDataUrl}
                    alt="Authenticator setup QR code"
                    className="h-44 w-44 rounded-md border border-border bg-white p-2"
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-md border border-border bg-muted/40 text-[12px] text-muted-foreground">
                    Generating QR…
                  </div>
                )}
                {setupUri && (
                  <code
                    className="block w-full min-w-0 max-w-full truncate rounded border border-border/70 bg-muted/30 px-2 py-1.5 text-center font-mono text-[10px] text-muted-foreground"
                    title={setupUri}
                  >
                    {setupUri}
                  </code>
                )}
                <div className="w-full space-y-2 border-t border-border/60 pt-4">
                  <Label className="block text-center text-[13px]">Verification code</Label>
                  <OtpInput value={verifyCode} onChange={setVerifyCode} />
                  {notice && (
                    <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" /> {notice}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={closeSetup} className="h-9">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVerifyAuthenticator}
                      disabled={verifyCode.length !== 6}
                      className="h-9"
                    >
                      Verify &amp; activate
                    </Button>
                  </div>
                </div>
                <p className="w-full text-[11px] text-muted-foreground">
                  UI preview — enrollment will be wired to the TOTP endpoints with the updated contract.
                </p>
              </div>
            </>
          )}

          {setupStep === "done" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Two-factor is active
                </DialogTitle>
                <DialogDescription>
                  Your selected verification methods are ready. Confirm your password later to manage them.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 rounded-md border border-border/70 bg-background/50 p-3">
                {factors.map((factor) => (
                  <div key={factor} className="flex items-center gap-2 text-[13px] text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {FACTOR_LABELS[factor]}
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-border/60 pt-4">
                <Button type="button" onClick={closeSetup} className="h-9">
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
