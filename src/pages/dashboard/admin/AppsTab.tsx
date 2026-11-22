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
  AppWindow,
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
import { formatDateTime } from "@/lib/utils";

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

  const confidentialCount = useMemo(() => {
    return clients.filter((c) => c.client_type === "confidential").length;
  }, [clients]);

  const publicCount = useMemo(() => {
    return clients.filter((c) => c.client_type === "public").length;
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Application Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register and administer OAuth 2.0 / OpenID Connect clients, relying parties, and Single Sign-On integrations.
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
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
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
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Applications</p>
            <p className="text-xl font-bold text-foreground font-mono">{clients.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <AppWindow className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Confidential Clients</p>
            <p className="text-xl font-bold text-foreground font-mono">{confidentialCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Public Clients (SPA)</p>
            <p className="text-xl font-bold text-foreground font-mono">{publicCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
            <Globe className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by application, client ID, or URI..."
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

        {/* Client Type Filter Tabs */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-muted/30 p-1 rounded-lg border border-border/60">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setTypeFilter("confidential")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              typeFilter === "confidential"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Confidential ({confidentialCount})
          </button>
          <button
            onClick={() => setTypeFilter("public")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              typeFilter === "public"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Public ({publicCount})
          </button>
        </div>
      </div>

      {/* Applications Directory Table Card */}
      <TooltipProvider delayDuration={150}>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-transparent text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TableHead className="py-2.5 min-w-[200px]">Application</TableHead>
                  <TableHead className="py-2.5 min-w-[140px]">Client ID</TableHead>
                  <TableHead className="py-2.5 min-w-[110px]">Type</TableHead>
                  <TableHead className="py-2.5 min-w-[200px]">Redirect URIs</TableHead>
                  <TableHead className="py-2.5 min-w-[160px]">Allowed Scopes</TableHead>
                  <TableHead className="py-2.5 min-w-[130px]">Created</TableHead>
                  <TableHead className="py-2.5 min-w-[90px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span>Loading registered applications...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <AppWindow className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                        {searchQuery || typeFilter !== "all" ? (
                          <>
                            <p className="font-medium text-foreground">No matching applications</p>
                            <p className="text-[11px] text-muted-foreground">Try adjusting your search query or filters.</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSearchQuery("");
                                setTypeFilter("all");
                              }}
                              className="h-7 px-2.5 text-xs text-primary mt-1"
                            >
                              Reset Filters
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-foreground">No applications registered</p>
                            <p className="text-[11px] text-muted-foreground">Register your first OAuth 2.0 / OpenID Connect application to enable SSO.</p>
                            <Button
                              size="sm"
                              onClick={() => setIsCreateOpen(true)}
                              className="h-8 px-3 text-xs font-semibold rounded-lg mt-2"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              <span>Register Application</span>
                            </Button>
                          </>
                        )}
                      </div>
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
                        {/* Application Name */}
                        <TableCell className="py-2.5">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isConfidential
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                                  : "bg-sky-500/10 border-sky-500/20 text-sky-500"
                              }`}
                            >
                              {isConfidential ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Globe className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[200px]" title={client.client_name}>
                                {client.client_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {isConfidential ? "Confidential Client" : "Public Client (SPA)"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Client ID */}
                        <TableCell className="py-2.5 font-mono text-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="truncate max-w-[120px] text-muted-foreground font-mono" title={client.client_id}>
                              {client.client_id}
                            </span>
                            <CopyButton value={client.client_id} className="h-5 px-1 text-[10px] rounded" />
                          </div>
                        </TableCell>

                        {/* Client Type */}
                        <TableCell className="py-2.5">
                          <Badge
                            variant="outline"
                            className={`rounded-md text-[10px] py-0 px-2 font-semibold capitalize flex items-center w-fit gap-1 ${
                              isConfidential
                                ? "border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                                : "border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10"
                            }`}
                          >
                            {isConfidential ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                            <span>{client.client_type}</span>
                          </Badge>
                        </TableCell>

                        {/* Redirect URIs (Compact with +N more tooltip) */}
                        <TableCell className="py-2.5 font-mono text-xs">
                          {primaryUri ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-foreground text-[11px] truncate max-w-[180px]" title={primaryUri}>
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

                        {/* Allowed Scopes */}
                        <TableCell className="py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(client.allowed_scopes || ["openid"]).map((s) => (
                              <span
                                key={s}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/80"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(client.created_at)}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-2.5 text-right whitespace-nowrap">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRevokingClient(client)}
                            className="h-7 px-2.5 text-xs rounded-lg font-medium"
                            title="Revoke this application"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
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
        </div>
      </TooltipProvider>

      {/* Register Application Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => (!open ? closeCreateModal() : setIsCreateOpen(true))}>
        <DialogContent className="sm:max-w-lg">
          {createdClient ? (
            /* CRITICAL ONE-TIME SECRET VIEW */
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      Client Credentials Generated
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                      Save these credentials now. The client secret will not be displayed again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Alert variant="destructive" className="py-2.5 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">One-Time Secret Notice</AlertTitle>
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
                  className="w-full h-10 font-semibold rounded-lg shadow-xs"
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
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      Register New Application
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                      Configure an OAuth 2.0 / OpenID Connect client profile and credentials.
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

              <div className="space-y-4">
                {/* Application Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-medium">Application Name</Label>
                  <Input
                    id="clientName"
                    required
                    placeholder="e.g. Internal Analytics Dashboard"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={creating}
                    className="h-9 rounded-lg bg-background/50 focus:bg-background text-xs"
                  />
                </div>

                {/* Client Profile Type Selector (Segmented Cards) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Client Profile Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => !creating && setClientType("confidential")}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col space-y-1 ${
                        clientType === "confidential"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/80 bg-background/50 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <Lock className={`h-3.5 w-3.5 ${clientType === "confidential" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-xs text-foreground">Confidential</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground leading-snug">
                        Backend service or server with a secure client secret
                      </span>
                    </div>

                    <div
                      onClick={() => !creating && setClientType("public")}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col space-y-1 ${
                        clientType === "public"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/80 bg-background/50 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <Globe className={`h-3.5 w-3.5 ${clientType === "public" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-xs text-foreground">Public (SPA)</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground leading-snug">
                        Single-page web client or mobile native app (PKCE)
                      </span>
                    </div>
                  </div>
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
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {[
                      { id: "openid", label: "openid", desc: "OpenID Connect" },
                      { id: "email", label: "email", desc: "Corporate Email" },
                      { id: "profile", label: "profile", desc: "Profile Information" },
                    ].map((scope) => (
                      <label
                        key={scope.id}
                        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                          allowedScopes.includes(scope.id)
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/80 text-muted-foreground hover:bg-muted/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allowedScopes.includes(scope.id)}
                          onChange={() => handleScopeToggle(scope.id)}
                          className="rounded border-input text-primary focus:ring-ring h-3.5 w-3.5"
                          disabled={creating}
                        />
                        <span className="font-mono text-xs font-medium">{scope.label}</span>
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
              ? All active tokens and SSO login requests for this client ID will fail immediately.
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
