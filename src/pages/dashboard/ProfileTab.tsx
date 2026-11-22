import { useState, useEffect } from "react";
import { User, Shield, Key, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { UserProfile } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Profile & Identity
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identity claims, role-based authorization governance, and two-factor security credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProfile}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium self-start sm:self-auto border-border hover:bg-muted/60"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Identity</span>
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Identity Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Principal Identity (User) */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none flex flex-col justify-between">
          <div>
            {/* Header with matching icon & status indicator */}
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="success" className="gap-1 font-mono text-[10px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Principal Identity
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate mt-0.5" title={effectiveUser?.email}>
                {effectiveUser?.email || "—"}
              </h2>
            </div>

            {/* Detailed Metadata Rows */}
            <div className="mt-5 space-y-3 pt-4 border-t border-border/60 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block">Unique User ID</span>
                <div className="flex items-center justify-between mt-1 p-1.5 rounded bg-muted/40 border border-border/60">
                  <span className="font-mono text-[11px] text-foreground truncate mr-2">
                    {effectiveUser?.id || "usr_identity"}
                  </span>
                  <CopyButton value={effectiveUser?.id || ""} className="h-6 px-1.5 text-[10px] shrink-0" />
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Directory Realm</span>
                <span className="text-foreground font-mono font-medium">corporate-sso</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Member Since</span>
                <span className="text-foreground font-mono">
                  {formatDateTime(effectiveUser?.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-medium">Verification Status</span>
                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Email Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: RBAC Authority (Shield) */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none flex flex-col justify-between">
          <div>
            {/* Header with matching icon & Role badge */}
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <Badge variant={isAdmin ? "default" : "secondary"} className="font-mono text-[10px] tracking-wider uppercase">
                {effectiveUser?.role?.toUpperCase() || "USER"}
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                RBAC Authority
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {isAdmin ? "Enterprise Administrator" : "Standard Employee"}
              </h2>
            </div>

            {/* Detailed Scope Rows */}
            <div className="mt-5 space-y-3 pt-4 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Clearance Level</span>
                <span className="text-foreground font-semibold">
                  {isAdmin ? "Tier-1 Governance" : "Tier-2 Employee"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Access Scope</span>
                <span className="text-foreground font-medium">
                  {isAdmin ? "Full System Control" : "Self-Service Workspace"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">Authorized Capabilities</span>
                <div className="space-y-1.5">
                  {isAdmin ? (
                    <>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>User lifecycle governance (create, lock, promote)</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>OAuth / OIDC application client registration</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>System-wide audit logs & cross-tenant telemetry</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>Global session termination & emergency revoking</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>Identity profile inspection & credential review</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>Self active device & browser session management</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-foreground font-medium">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        <span>Enterprise Single Sign-On (SSO) authentication</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 2FA & Credentials (Key) */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none flex flex-col justify-between">
          <div>
            {/* Header with matching icon & Enforced badge */}
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="warning" className="font-mono text-[10px] tracking-wider uppercase">
                Enforced
              </Badge>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2FA & Credentials
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Two-Factor Authentication (2FA)
              </h2>
            </div>

            {/* Detailed Security & Policy Rows */}
            <div className="mt-5 space-y-3 pt-4 border-t border-border/60 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Second Factor (2FA)</span>
                <span className="text-foreground font-medium">Email Challenge (OTP)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Code Expiration</span>
                <div className="flex items-center space-x-1 font-mono text-[11px] text-foreground">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>10 Minutes</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Idle Session Timeout</span>
                <span className="text-foreground font-mono font-medium">30 Minutes</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Absolute Session Cap</span>
                <span className="text-foreground font-mono font-medium">8 Hours</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-medium">Lockout Threshold</span>
                <span className="text-foreground font-medium">3 Consecutive Strikes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
