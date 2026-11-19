import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { OAuthClient, ClientType } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/utils";

export function AppsTab() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      // Show one-time secret view!
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

  return (
    <div className="space-y-6">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
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
            className="h-8 text-xs font-mono"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Register Application</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Applications Table Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Registered Clients Directory
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Authorized identity relying parties capable of initiating SSO authorization code flows.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {clients.length} Registered
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Application Name</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Client Type</TableHead>
                <TableHead>Allowed Scopes</TableHead>
                <TableHead>Redirect URIs</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs">
                    {loading ? "Loading registered applications..." : "No OAuth applications found."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium text-xs text-foreground">
                      {client.client_name}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center">
                        <span className="truncate max-w-[140px] text-muted-foreground mr-1">
                          {client.client_id}
                        </span>
                        <CopyButton value={client.client_id} className="h-5 px-1 text-[10px]" />
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={client.client_type === "confidential" ? "default" : "secondary"}>
                        {client.client_type.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(client.allowed_scopes || ["openid"]).map((s) => (
                          <span
                            key={s}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground min-w-[260px]">
                      <div className="flex flex-col gap-1.5 py-1">
                        {(client.redirect_uris || []).map((uri, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between space-x-1.5 px-2 py-1 rounded bg-muted/40 border border-border/70 select-all group"
                          >
                            <span className="font-mono text-foreground text-[11px] break-all leading-normal">
                              {uri}
                            </span>
                            <CopyButton value={uri} className="h-5 px-1 text-[10px] shrink-0 opacity-70 hover:opacity-100" />
                          </div>
                        ))}
                        {(!client.redirect_uris || client.redirect_uris.length === 0) && (
                          <span className="text-muted-foreground italic">None configured</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(client.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokingClient(client)}
                        className="h-7 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        <span>Revoke</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Application Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => (!open ? closeCreateModal() : setIsCreateOpen(true))}>
        <DialogContent className="sm:max-w-md">
          {createdClient ? (
            /* CRITICAL ONE-TIME SECRET VIEW */
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center text-foreground">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mr-2" />
                  Application Credentials Generated
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Copy and securely persist the client credentials below.
                </DialogDescription>
              </DialogHeader>

              <Alert variant="destructive" className="py-2.5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Important Security Notice</AlertTitle>
                <AlertDescription className="text-[11px] leading-normal">
                  The <span className="font-mono font-semibold">client_secret</span> will never be shown again. If lost, you must generate a new application secret.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px]">Client ID</Label>
                  <div className="flex items-center space-x-1 p-2 rounded-md border border-border bg-muted/40">
                    <span className="truncate flex-1 select-all">{createdClient.client_id}</span>
                    <CopyButton value={createdClient.client_id} />
                  </div>
                </div>

                {createdClient.client_secret && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">Client Secret (One-Time Display)</Label>
                    <div className="flex items-center space-x-1 p-2 rounded-md border border-border bg-muted/40 text-primary font-semibold">
                      <span className="truncate flex-1 select-all">{createdClient.client_secret}</span>
                      <CopyButton value={createdClient.client_secret} />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acknowledgedSecret}
                    onChange={(e) => setAcknowledgedSecret(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span>I have securely saved the client secret</span>
                </label>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={closeCreateModal}
                  disabled={!acknowledgedSecret}
                  className="w-full"
                >
                  Done & Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Form Mode */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Register New Application</DialogTitle>
                <DialogDescription>
                  Configure a new OAuth 2.0 / OpenID Connect relying party client.
                </DialogDescription>
              </DialogHeader>

              {createError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="clientName">Application Name</Label>
                  <Input
                    id="clientName"
                    required
                    placeholder="e.g. Internal Payroll Portal"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="clientType">Client Profile Type</Label>
                  <select
                    id="clientType"
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as ClientType)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={creating}
                  >
                    <option value="confidential">Confidential (Backend Service / Secure Server)</option>
                    <option value="public">Public (SPA Web Client / Mobile Native App)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="redirectUris">Allowed Redirect URIs (Comma or newline separated)</Label>
                  <textarea
                    id="redirectUris"
                    rows={2}
                    required
                    placeholder="https://app.company.com/oauth/callback"
                    value={redirectUrisInput}
                    onChange={(e) => setRedirectUrisInput(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={creating}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Authorized Scopes</Label>
                  <div className="flex items-center space-x-4 pt-1">
                    {["openid", "email", "profile"].map((scope) => (
                      <label key={scope} className="flex items-center space-x-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allowedScopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope)}
                          className="rounded border-input text-primary focus:ring-ring"
                          disabled={creating}
                        />
                        <span className="font-mono">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={closeCreateModal} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
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
            <DialogTitle className="text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Revoke Application Access
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to deactivate and revoke{" "}
              <span className="font-semibold text-foreground">
                "{revokingClient?.client_name}"
              </span>
              ? All live tokens and SSO login requests for this client ID will fail immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRevokingClient(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRevoke}>
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
