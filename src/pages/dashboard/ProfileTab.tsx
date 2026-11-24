import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Shield, Key, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { UserProfile } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { cn, formatDateTime } from "@/lib/utils";

export function ProfileTab() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMe();
      setProfile(data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load live profile telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const effectiveUser = profile || authUser;
  const isAdmin = effectiveUser?.role === "admin";

  // Posture is derived only from real profile data. `two_factor_enabled` is
  // supported defensively when a backend exposes it; `totp_enabled` is the
  // canonical field on UserProfile.
  const status = (effectiveUser?.status || "").toUpperCase();
  const identityVerified = status === "ACTIVE";
  const mfaEnabled = Boolean(
    (effectiveUser as (UserProfile & { two_factor_enabled?: boolean }) | null)?.two_factor_enabled ??
      effectiveUser?.totp_enabled
  );
  const sessionPolicyActive = true; // platform-enforced; not a per-user claim
  const roleAssigned = Boolean(effectiveUser?.role);

  const posture = [
    {
      label: "Identity verified",
      value: identityVerified ? "Verified" : "Unverified",
      active: identityVerified,
    },
    {
      label: "MFA active",
      value: mfaEnabled ? "Enrolled" : "Not enrolled",
      active: mfaEnabled,
    },
    {
      label: "Session policy",
      value: "Enforced",
      active: sessionPolicyActive,
    },
    {
      label: "Access role",
      value: roleAssigned ? (isAdmin ? "Administrator" : "Standard user") : "Unassigned",
      active: roleAssigned,
    },
  ];
  const activeCount = posture.filter((item) => item.active).length;
  const postureHeadline =
    activeCount === posture.length
      ? "All controls satisfied"
      : activeCount >= 2
      ? "Review recommended"
      : "Attention required";

  const statusLabel = effectiveUser?.status
    ? status.charAt(0) + status.slice(1).toLowerCase()
    : "Unknown";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[38px]">
            Profile &amp; identity
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Identity claims, role-based authorization, and two-factor credentials for this principal.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProfile}
          disabled={loading}
          className="h-9 shrink-0 gap-2 self-start border-border px-3.5 font-display text-[13px] font-medium hover:bg-muted/60 sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>{loading ? "Refreshing" : "Refresh identity"}</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 border-l-2 border-destructive bg-muted/40 py-3 pl-4 pr-3 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{error}</span>
        </div>
      )}

      {/* The single focal graphic: identity posture ledger */}
      <section className="relative overflow-hidden rounded-lg border border-border bg-card">
        <div className="h-[3px] w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="font-display text-xs font-semibold tracking-wide text-muted-foreground">
              Identity posture
            </p>
            <h2 className="mt-3 font-display text-[26px] font-bold leading-tight tracking-[-0.025em] text-foreground">
              {postureHeadline}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeCount} of {posture.length} access controls active for this principal.
            </p>

            <div className="mt-6 space-y-3 border-t border-border pt-5">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Principal</p>
                <p className="mt-1 truncate font-mono text-[13px] text-foreground" title={effectiveUser?.email}>
                  {effectiveUser?.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">User ID</p>
                <p className="mt-1 truncate font-mono text-[12px] text-foreground">
                  {effectiveUser?.id || "usr_identity"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center lg:col-span-7">
            <div
              className="flex gap-1.5 sm:gap-2"
              role="img"
              aria-label={`${activeCount} of ${posture.length} identity controls active`}
            >
              {posture.map((item) => (
                <div key={item.label} className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "h-2.5 rounded-full transition-colors sm:h-3",
                      item.active ? "bg-primary shadow-glow-sm" : "bg-muted"
                    )}
                  />
                  <div className="mt-3.5 border-t border-border pt-3">
                    <p className="font-display text-[12px] font-semibold leading-snug text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          item.active ? "bg-emerald-500" : "bg-muted-foreground/40"
                        )}
                      />
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detail ledger — one wide identity column, two quieter context columns */}
      <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-card lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Principal identity — wide */}
        <section className="p-6 sm:p-7 lg:col-span-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                <User className="h-4 w-4" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Principal identity</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 font-display text-[11px] font-medium text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  identityVerified ? "bg-emerald-500" : "bg-destructive"
                )}
              />
              {statusLabel}
            </span>
          </div>

          <p className="mt-5 truncate font-mono text-sm text-foreground" title={effectiveUser?.email}>
            {effectiveUser?.email || "—"}
          </p>

          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-[13px]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Directory realm</dt>
              <dd className="font-mono text-foreground">corporate-sso</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-mono text-[12px] text-foreground">
                {formatDateTime(effectiveUser?.created_at)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Verification</dt>
              <dd className="flex items-center gap-1.5 text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Email verified
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Unique user ID</dt>
              <dd className="flex items-center gap-1.5">
                <code className="max-w-[180px] truncate font-mono text-[12px] text-foreground">
                  {effectiveUser?.id || "usr_identity"}
                </code>
                <CopyButton value={effectiveUser?.id || ""} className="h-6 shrink-0 px-1.5 text-[10px]" />
              </dd>
            </div>
          </dl>
        </section>

        {/* Access authority */}
        <section className="p-6 sm:p-7 lg:col-span-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
              <Shield className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-semibold text-foreground">Access authority</h3>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-foreground"
            >
              {effectiveUser?.role || "USER"}
            </Badge>
            <span className="text-[13px] text-muted-foreground">
              {isAdmin ? "Enterprise administrator" : "Standard employee"}
            </span>
          </div>

          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Clearance</dt>
              <dd className="text-right font-medium text-foreground">
                {isAdmin ? "Tier-1 governance" : "Tier-2 employee"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="text-right font-medium text-foreground">
                {isAdmin ? "Full system control" : "Self-service workspace"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-5">
            <p className="text-[11px] font-medium text-muted-foreground">Authorized capabilities</p>
            <ul className="mt-2.5 space-y-2">
              {(isAdmin
                ? [
                    "User lifecycle governance (create, lock, promote)",
                    "OAuth / OIDC application client registration",
                    "System-wide audit logs & cross-tenant telemetry",
                    "Global session termination & emergency revoking",
                  ]
                : [
                    "Identity profile inspection & credential review",
                    "Self active device & browser session management",
                    "Enterprise Single Sign-On (SSO) authentication",
                  ]
              ).map((capability) => (
                <li key={capability} className="flex gap-2 text-[12px] leading-snug text-foreground">
                  <span className="mt-1.5 h-px w-2 shrink-0 bg-muted-foreground/50" />
                  {capability}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Credential policy */}
        <section className="p-6 sm:p-7 lg:col-span-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
              <Key className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-semibold text-foreground">Credential policy</h3>
          </div>

          <p className="mt-5 text-[13px] font-medium text-foreground">Two-factor authentication</p>

          <dl className="mt-4 space-y-3 border-t border-border pt-5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Second factor</dt>
              <dd className="text-right font-medium text-foreground">Email challenge (OTP)</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Code expiration</dt>
              <dd className="flex items-center gap-1.5 font-mono text-[12px] text-foreground">
                <Clock className="h-3 w-3 text-muted-foreground" />
                10 minutes
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Idle timeout</dt>
              <dd className="font-mono text-[12px] text-foreground">30 minutes</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Absolute cap</dt>
              <dd className="font-mono text-[12px] text-foreground">8 hours</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Lockout threshold</dt>
              <dd className="text-right font-medium text-foreground">3 consecutive strikes</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-6 flex justify-end border-t border-border pt-4">
        <Link
          to="/dashboard/settings"
          className="font-display text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
        >
          View policy
        </Link>
      </div>
    </div>
  );
}
