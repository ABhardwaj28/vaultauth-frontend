import { useState, useEffect } from "react";
import { User, Shield, Key, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { UserProfile } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            User Profile & Governance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographic identity and authorization claims bound to your active session.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProfile}
          disabled={loading}
          className="h-8 text-xs font-mono self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Identity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Principal Identity */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Principal Identity
              </span>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold truncate mt-1">
              {effectiveUser?.email || "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-muted-foreground">User ID:</span>
              <div className="flex items-center">
                <span className="truncate max-w-[120px] text-foreground mr-1">
                  {effectiveUser?.id || "usr_identity"}
                </span>
                <CopyButton value={effectiveUser?.id || ""} className="h-5 px-1 text-[10px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Role & Authority */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                RBAC Authority
              </span>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold mt-1">
              {effectiveUser?.role === "admin" ? "Enterprise Administrator" : "Standard Employee"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assigned Role:</span>
              <Badge variant={effectiveUser?.role === "admin" ? "default" : "secondary"}>
                {effectiveUser?.role?.toUpperCase() || "USER"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Security & 2FA State */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                2FA & Credentials
              </span>
              <Key className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold mt-1">
              Multi-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Two-Factor OTP:</span>
              <Badge variant="success">Enforced (Email OTP)</Badge>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="text-foreground">
                {formatDateTime(effectiveUser?.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cryptographic Architecture Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Zero-Trust Cryptographic Enforcement
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Technical assurances implemented by the backend authentication engine per PRD v2.0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-md border border-border bg-muted/20">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">
                Password Hashing
              </div>
              <div className="font-semibold text-foreground mt-0.5">
                Argon2id Memory-Hard
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Zero cleartext storage or plaintext logs.
              </p>
            </div>

            <div className="p-3 rounded-md border border-border bg-muted/20">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">
                Session Tokens
              </div>
              <div className="font-semibold text-foreground mt-0.5">
                Opaque 256-Bit Bearer
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Persisted exclusively as SHA-256 database hashes.
              </p>
            </div>

            <div className="p-3 rounded-md border border-border bg-muted/20">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">
                Revocation Boundary
              </div>
              <div className="font-semibold text-primary mt-0.5">
                Instant (&lt;30s SLA)
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Evaluated per request in PostgreSQL transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
