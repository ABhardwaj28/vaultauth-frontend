import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Lock,
  Globe,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { OAuthClient, ClientType } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export function AppsTab() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "confidential" | "public">("all");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("confidential");
  const [redirectUrisInput, setRedirectUrisInput] = useState("https://myapp.internal/callback");
  const [allowedScopes, setAllowedScopes] = useState<string[]>(["openid", "email", "profile"]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Critical One-Time Secret Reveal State
  const [createdClient, setCreatedClient] = useState<OAuthClient | null>(null);
  const [acknowledgedSecret, setAcknowledgedSecret] = useState(false);

  // Revoke Dialog State
  const [revokingClient, setRevokingClient] = useState<OAuthClient | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOAuthClients();
      setClients(data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to query OAuth client directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleScopeToggle = (scope: string) => {
    setAllowedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const uris = redirectUrisInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (!clientName.trim()) {
      setCreateError("Application name is required.");
      return;
    }

    if (uris.length === 0) {
      setCreateError("At least one valid redirect URI is required.");
      return;
    }

    setCreating(true);

    try {
      const newClient = await api.createOAuthClient({
        client_name: clientName.trim(),
        client_type: clientType,
        redirect_uris: uris,
        allowed_scopes: allowedScopes,
      });

      // Show one-time secret view
      setCreatedClient(newClient);
      setClients((prev) => [newClient, ...prev]);
      setSuccessMessage(`Application "${newClient.client_name}" registered successfully.`);
    } catch (err: unknown) {
      setCreateError((err as { message?: string })?.message || "Failed to register application.");
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreatedClient(null);
    setAcknowledgedSecret(false);
    setClientName("");
    setRedirectUrisInput("https://myapp.internal/callback");
    setAllowedScopes(["openid", "email", "profile"]);
    setCreateError(null);
  };

  const handleConfirmRevoke = async () => {
    if (!revokingClient) return;
    try {
      await api.revokeOAuthClient(revokingClient.client_id);
      setClients((prev) => prev.filter((c) => c.client_id !== revokingClient.client_id));
      setSuccessMessage(`Application "${revokingClient.client_name}" revoked.`);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to revoke application.");
    } finally {
      setRevokingClient(null);
    }
  };

  // Filtered & Searched Clients
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((client) => {
      const matchesType =
        typeFilter === "all" || client.client_type.toLowerCase() === typeFilter;
      if (!matchesType) return false;

      if (!q) return true;

      const nameMatch = client.client_name.toLowerCase().includes(q);
      const idMatch = client.client_id.toLowerCase().includes(q);
      const uriMatch = (client.redirect_uris || []).some((u) => u.toLowerCase().includes(q));
      const scopeMatch = (client.allowed_scopes || []).some((s) => s.toLowerCase().includes(q));

      return nameMatch || idMatch || uriMatch || scopeMatch;
    });
  }, [clients, searchQuery, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            OAuth 2.0 / OIDC Applications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered Single Sign-On relying parties, public SPAs, and confidential server clients.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClients}
            disabled={loading}
            className="h-8 px-3 text-xs font-medium rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 text-xs font-semibold rounded-lg shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Register Application</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:opacity-80 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search applications, client IDs, or URIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 rounded-lg bg-background/50 focus:bg-background text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-muted-foreground font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "confidential" | "public")}
              className="h-8 rounded-lg border border-input bg-background/50 focus:bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="all">All Types</option>
              <option value="confidential">Confidential</option>
              <option value="public">Public (SPA)</option>
            </select>
          </div>

          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 rounded-md">
            {filteredClients.length} {filteredClients.length === 1 ? "Client" : "Clients"}
          </Badge>
        </div>
      </div>

      {/* Applications Directory Table Card */}
      <TooltipProvider delayDuration={150}>
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none">
          <Table wrapperClassName="overflow-x-auto md:overflow-x-hidden" className="w-full table-fixed">
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-transparent text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TableHead className="py-2.5 px-3 w-[28%]">Application / Client ID</TableHead>
                <TableHead className="py-2.5 px-3 w-[13%]">Client Type</TableHead>
                <TableHead className="py-2.5 px-3 w-[24%]">Redirect URIs</TableHead>
                <TableHead className="py-2.5 px-3 w-[14%]">Allowed Scopes</TableHead>
                <TableHead className="py-2.5 px-3 w-[11%]">Created</TableHead>
                <TableHead className="py-2.5 px-3 w-[10%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-xs">
                    Loading registered applications...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-xs">
                    {searchQuery || typeFilter !== "all"
                      ? "No applications match the current filter."
                      : "No OAuth applications found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const uris = client.redirect_uris || [];
                  const primaryUri = uris[0] || null;
                  const remainingUris = uris.slice(1);
                  const isConfidential = client.client_type === "confidential";

                  return (
                    <TableRow
                      key={client.client_id}
                      className="border-b border-border/60 hover:bg-muted/20 text-xs transition-colors"
                    >
                      {/* Application Name & Client ID */}
                      <TableCell className="py-2.5 px-3 min-w-0">
                        <div className="flex flex-col space-y-0.5 min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate block" title={client.client_name}>
                            {client.client_name}
                          </span>
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-muted-foreground min-w-0">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 shrink-0">ID:</span>
                            <span className="truncate" title={client.client_id}>
                              {client.client_id}
                            </span>
                            <CopyButton value={client.client_id} className="h-4 px-1 text-[9px] rounded shrink-0" />
                          </div>
                        </div>
                      </TableCell>

                      {/* Client Type */}
                      <TableCell className="py-2.5 px-3 min-w-0">
                        <Badge
                          variant={isConfidential ? "default" : "secondary"}
                          className="rounded-md text-[10px] py-0 px-2 font-semibold uppercase flex items-center w-fit gap-1 shrink-0"
                        >
                          {isConfidential ? <Lock className="h-2.5 w-2.5 shrink-0" /> : <Globe className="h-2.5 w-2.5 shrink-0" />}
                          <span>{client.client_type}</span>
                        </Badge>
                      </TableCell>

                      {/* Redirect URIs (Compact with +N tooltip) */}
                      <TableCell className="font-mono text-xs py-2.5 px-3 min-w-0">
                        {primaryUri ? (
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="font-mono text-foreground text-[11px] truncate" title={primaryUri}>
                              {primaryUri}
                            </span>
                            <CopyButton value={primaryUri} className="h-4 px-1 text-[9px] rounded shrink-0 opacity-70 hover:opacity-100" />
                            {remainingUris.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-mono py-0 px-1.5 cursor-pointer shrink-0"
                                  >
                                    +{remainingUris.length}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs font-mono text-[10px] space-y-1 p-2">
                                  <p className="font-bold text-foreground pb-1 border-b border-border/60">
                                    All Redirect URIs ({uris.length}):
                                  </p>
                                  {uris.map((u, i) => (
                                    <div key={i} className="break-all text-muted-foreground">
                                      {u}
                                    </div>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">None configured</span>
                        )}
                      </TableCell>

                      {/* Allowed Scopes (Clean Inline Truncated List with Tooltip) */}
                      <TableCell className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground min-w-0">
                        <span
                          className="truncate block"
                          title={client.allowed_scopes && client.allowed_scopes.length > 0 ? client.allowed_scopes.join(", ") : "openid"}
                        >
                          {client.allowed_scopes && client.allowed_scopes.length > 0
                            ? client.allowed_scopes.join(", ")
                            : "openid"}
                        </span>
                      </TableCell>

                      {/* Created Date (Compact Relative with Full Tooltip) */}
                      <TableCell className="font-mono text-xs text-muted-foreground py-2.5 px-3 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block cursor-default">
                              {formatRelativeTime(client.created_at)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-[11px] font-mono">
                            {formatDateTime(client.created_at)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right py-2.5 px-3 shrink-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRevokingClient(client)}
                          className="h-7 px-2.5 text-xs rounded-lg font-medium shadow-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1 shrink-0" />
                          <span>Revoke</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* Register Application Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => (!open ? closeCreateModal() : setIsCreateOpen(true))}>
        <DialogContent className="sm:max-w-md">
          {createdClient ? (
            /* CRITICAL ONE-TIME SECRET VIEW */
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      Credentials Generated
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                      Save these credentials now. The client secret will never be displayed again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Alert variant="destructive" className="py-2.5 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Important Security Notice</AlertTitle>
                <AlertDescription className="text-[11px] leading-normal mt-0.5">
                  The <span className="font-mono font-semibold">client_secret</span> cannot be recovered after this dialog closes.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-sans">Client ID</Label>
                  <div className="flex items-center space-x-1.5 p-2 rounded-lg border border-border/80 bg-background/60">
                    <span className="truncate flex-1 select-all font-mono text-xs">{createdClient.client_id}</span>
                    <CopyButton value={createdClient.client_id} />
                  </div>
                </div>

                {createdClient.client_secret && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px] font-sans">Client Secret (One-Time Display)</Label>
                    <div className="flex items-center space-x-1.5 p-2 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold">
                      <span className="truncate flex-1 select-all font-mono text-xs">{createdClient.client_secret}</span>
                      <CopyButton value={createdClient.client_secret} />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acknowledgedSecret}
                    onChange={(e) => setAcknowledgedSecret(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-ring h-4 w-4"
                  />
                  <span>I have securely saved the client secret</span>
                </label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  onClick={closeCreateModal}
                  disabled={!acknowledgedSecret}
                  className="w-full h-9 font-semibold rounded-lg shadow-xs"
                >
                  Done & Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Form Mode */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      Register New Application
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                      Configure an OAuth 2.0 / OpenID Connect relying party client.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {createError && (
                <Alert variant="destructive" className="py-2 text-xs rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{createError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3.5">
                {/* Application Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-medium">Application Name</Label>
                  <Input
                    id="clientName"
                    required
                    placeholder="e.g. Internal Payroll Portal"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={creating}
                    className="h-9 rounded-lg bg-background/50 focus:bg-background text-xs"
                  />
                </div>

                {/* Client Profile Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="clientType" className="text-xs font-medium">Client Profile Type</Label>
                  <select
                    id="clientType"
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as ClientType)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background/50 focus:bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    disabled={creating}
                  >
                    <option value="confidential">Confidential (Backend Service / Secure Server)</option>
                    <option value="public">Public (SPA Web Client / Mobile Native App)</option>
                  </select>
                </div>

                {/* Redirect URIs */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="redirectUris" className="text-xs font-medium">Allowed Redirect URIs</Label>
                    <span className="text-[10px] text-muted-foreground">Comma or newline separated</span>
                  </div>
                  <textarea
                    id="redirectUris"
                    rows={2}
                    required
                    placeholder="https://app.company.com/oauth/callback"
                    value={redirectUrisInput}
                    onChange={(e) => setRedirectUrisInput(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background/50 focus:bg-background p-2.5 text-xs font-mono shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={creating}
                  />
                </div>

                {/* Scopes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Authorized Scopes</Label>
                  <div className="flex items-center space-x-4 pt-1">
                    {["openid", "email", "profile"].map((scope) => (
                      <label key={scope} className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowedScopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope)}
                          className="rounded border-input text-primary focus:ring-ring h-4 w-4"
                          disabled={creating}
                        />
                        <span className="font-mono">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeCreateModal} disabled={creating} className="h-9 rounded-lg text-xs font-medium">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="h-9 rounded-lg text-xs font-semibold shadow-xs">
                  {creating ? "Minting Credentials..." : "Create Client"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={Boolean(revokingClient)} onOpenChange={(open) => !open && setRevokingClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-destructive">
                Revoke Application Access
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to deactivate and revoke{" "}
              <span className="font-semibold text-foreground">
                "{revokingClient?.client_name}"
              </span>
              ? All live tokens and SSO login requests for this client ID will fail immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRevokingClient(null)} className="h-9 rounded-lg text-xs font-medium">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRevoke} className="h-9 rounded-lg text-xs font-semibold">
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
