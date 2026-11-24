import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  AlertTriangle,
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

type TypeFilter = "all" | "confidential" | "public";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confidential", label: "Confidential" },
  { value: "public", label: "Public (SPA)" },
];

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
    <div className="space-y-6 pb-1">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Administration / Application registry</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            OAuth applications
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Relying parties, browser clients, and server integrations currently trusted by this workspace.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchClients}
            disabled={loading}
            className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 rounded-lg px-3 text-xs font-semibold shadow-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span>Register application</span>
          </Button>
        </div>
      </header>

      {/* Notifications — quiet strips, colour carried by a status dot only */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 text-xs text-foreground shadow-sm dark:shadow-none">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="flex-1 leading-relaxed">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss notification"
            className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 text-xs text-foreground shadow-sm dark:shadow-none">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
          <span className="flex-1 leading-relaxed">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss notification"
            className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <TooltipProvider delayDuration={150}>
        {/* The registry — one surface, hairline-separated rows */}
        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm dark:shadow-none">
          <div className="flex flex-col gap-4 border-b border-border/80 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Application registry
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {filteredClients.length}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, client ID, URI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border-border/70 bg-background/60 pl-8 pr-8 text-xs focus:bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Type</span>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/20 p-1">
                {TYPE_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTypeFilter(option.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      typeFilter === option.value
                        ? "border border-primary/30 bg-primary/10 text-primary"
                        : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Reading the application registry...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 px-5 py-16 text-center text-xs text-muted-foreground">
              <ShieldCheck className="mb-0.5 h-6 w-6 text-muted-foreground/50" />
              <span className="font-medium text-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "No applications match these filters."
                  : "The registry is empty."}
              </span>
              <span>Register an application to mint its first client credentials.</span>
            </div>
          ) : (
            <>
              {/* Column labels — desktop only; rows align to this track */}
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.7fr)_100px_84px] items-center gap-5 border-b border-border/70 bg-muted/20 px-5 py-2.5 text-[11px] font-medium text-muted-foreground lg:grid">
                <span>Application</span>
                <span>Client ID</span>
                <span>Policy</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>

              {filteredClients.map((client) => {
                const uris = client.redirect_uris || [];
                const primaryUri = uris[0] || null;
                const remainingUris = uris.slice(1);
                const isConfidential = client.client_type === "confidential";
                const scopesText =
                  client.allowed_scopes && client.allowed_scopes.length > 0
                    ? client.allowed_scopes.join(", ")
                    : "openid";
                const initials =
                  client.client_name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0))
                    .join("")
                    .toUpperCase() || "AP";
                const isActive = client.is_active !== false;

                return (
                  <div
                    key={client.client_id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-b border-border/70 px-4 py-4 transition-colors last:border-0 hover:bg-muted/20 sm:px-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.7fr)_100px_84px] lg:gap-5"
                  >
                    {/* Application */}
                    <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] font-display text-[11px] font-semibold text-primary">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="block truncate font-display text-sm font-semibold text-foreground"
                          title={client.client_name}
                        >
                          {client.client_name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {isConfidential ? (
                            <Lock className="h-3 w-3 shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 shrink-0" />
                          )}
                          {isConfidential ? "Confidential client" : "Public client"}
                        </span>
                      </div>
                    </div>

                    {/* Client ID */}
                    <div className="col-span-2 flex min-w-0 items-center gap-1.5 lg:col-span-1">
                      <span
                        className="truncate font-mono text-[11px] text-muted-foreground"
                        title={client.client_id}
                      >
                        {client.client_id}
                      </span>
                      <CopyButton
                        value={client.client_id}
                        className="h-5 shrink-0 rounded px-1 text-[9px]"
                      />
                    </div>

                    {/* Policy — stated plainly, one hairline between the two facts */}
                    <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground lg:col-span-1">
                      <span>Scopes</span>
                      <span className="max-w-full truncate font-medium text-foreground/80" title={`scopes: ${scopesText}`}>
                        {scopesText}
                      </span>
                      <span className="hidden h-3 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
                      <span>Redirect</span>
                      {primaryUri ? (
                        <>
                          <span className="min-w-0 truncate font-medium text-foreground/80" title={primaryUri}>
                            {primaryUri}
                          </span>
                          <CopyButton
                            value={primaryUri}
                            className="h-5 shrink-0 rounded px-1 text-[9px] opacity-70 hover:opacity-100"
                          />
                          {remainingUris.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 cursor-pointer rounded px-1.5 py-0 font-mono text-[10px]"
                                >
                                  +{remainingUris.length}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs space-y-1 p-2 font-mono text-[10px]">
                                <p className="border-b border-border/60 pb-1 font-semibold text-foreground">
                                  All redirect URIs ({uris.length})
                                </p>
                                {uris.map((u, i) => (
                                  <div key={i} className="break-all text-muted-foreground">
                                    {u}
                                  </div>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <span className="italic">not configured</span>
                      )}
                    </div>

                    {/* Status — colour lives in the dot, not the label */}
                    <div className="flex flex-col items-start gap-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-destructive"
                          }`}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {isActive ? "Active" : "Paused"}
                        </span>
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-fit cursor-default font-mono text-[10px] text-muted-foreground">
                            Created {formatRelativeTime(client.created_at)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-[11px]">
                          {formatDateTime(client.created_at)}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Quiet outline action */}
                    <div className="justify-self-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokingClient(client)}
                        className="h-7 rounded-lg border-border/70 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3 w-3 shrink-0" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </TooltipProvider>

      {/* Register Application Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => (!open ? closeCreateModal() : setIsCreateOpen(true))}>
        <DialogContent className="sm:max-w-md">
          {createdClient ? (
            /* CRITICAL ONE-TIME SECRET VIEW */
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-base font-semibold text-foreground sm:text-lg">
                      Credentials generated
                    </DialogTitle>
                    <DialogDescription className="pt-0.5 text-xs text-muted-foreground">
                      Save these credentials now. The client secret will never be displayed again.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Alert variant="destructive" className="py-2.5 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Important security notice</AlertTitle>
                <AlertDescription className="mt-0.5 text-[11px] leading-normal">
                  The <span className="font-mono font-semibold">client_secret</span> cannot be recovered after this dialog closes.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] font-sans text-muted-foreground">Client ID</Label>
                  <div className="flex items-center space-x-1.5 rounded-lg border border-border/80 bg-background/60 p-2">
                    <span className="flex-1 select-all truncate font-mono text-xs">{createdClient.client_id}</span>
                    <CopyButton value={createdClient.client_id} />
                  </div>
                </div>

                {createdClient.client_secret && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-sans text-muted-foreground">Client secret (one-time display)</Label>
                    <div className="flex items-center space-x-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2 font-semibold text-primary">
                      <span className="flex-1 select-all truncate font-mono text-xs">{createdClient.client_secret}</span>
                      <CopyButton value={createdClient.client_secret} />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex cursor-pointer select-none items-center space-x-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={acknowledgedSecret}
                    onChange={(e) => setAcknowledgedSecret(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span>I have securely saved the client secret</span>
                </label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  onClick={closeCreateModal}
                  disabled={!acknowledgedSecret}
                  className="h-9 w-full rounded-lg font-semibold shadow-xs"
                >
                  Done &amp; close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Form Mode */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-base font-semibold text-foreground sm:text-lg">
                      Register new application
                    </DialogTitle>
                    <DialogDescription className="pt-0.5 text-xs text-muted-foreground">
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
                  <Label htmlFor="clientName" className="text-xs font-medium">Application name</Label>
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
                  <Label htmlFor="clientType" className="text-xs font-medium">Client profile type</Label>
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
                    <Label htmlFor="redirectUris" className="text-xs font-medium">Allowed redirect URIs</Label>
                    <span className="text-[10px] text-muted-foreground">Separate with commas or new lines</span>
                  </div>
                  <textarea
                    id="redirectUris"
                    rows={2}
                    required
                    placeholder="https://app.example.com/oauth/callback"
                    value={redirectUrisInput}
                    onChange={(e) => setRedirectUrisInput(e.target.value)}
                    className="flex w-full rounded-lg border border-input bg-background/50 focus:bg-background p-2.5 text-xs font-mono shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={creating}
                  />
                </div>

                {/* Scopes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Authorized scopes</Label>
                  <div className="flex items-center space-x-4 pt-1">
                    {["openid", "email", "profile"].map((scope) => (
                      <label key={scope} className="flex cursor-pointer select-none items-center space-x-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={allowedScopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
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
                  {creating ? "Minting credentials..." : "Create client"}
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle className="font-display text-base font-semibold text-destructive sm:text-lg">
                Revoke application access
              </DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-xs leading-relaxed text-muted-foreground">
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
              Confirm revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
