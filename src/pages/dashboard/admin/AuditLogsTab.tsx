import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronRight, AlertCircle, Globe, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { AuditLogItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime } from "@/lib/utils";

const AUDIT_EVENTS = [
  "All",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "2FA_CHALLENGE_ISSUED",
  "2FA_VERIFIED",
  "SESSION_REVOKED",
  "OAUTH_CLIENT_CREATED",
  "OAUTH_CLIENT_REVOKED",
  "OAUTH_TOKEN_ISSUED",
  "USER_UNLOCKED",
  "USER_STATUS_CHANGED",
  "ROLE_CHANGED",
];

const QUICK_EVENTS = [
  "All",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "SESSION_REVOKED",
  "ROLE_CHANGED",
];

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.getAdminUsers({ limit: 100, fetchAll: true });
      const list = res.users || res.items || [];
      const map: Record<string, string> = {};
      for (const u of list) {
        if (u.id && u.email) {
          map[u.id] = u.email;
          map[u.email.toLowerCase().trim()] = u.id;
        }
      }
      setUsersMap((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData] = await Promise.all([
        api.getAuditLogs({
          event: selectedEvent !== "All" ? selectedEvent : undefined,
          limit,
        }),
        fetchUsers(),
      ]);
      setLogs(logsData);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to query security audit trail.");
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, limit, fetchUsers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: number | string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getEventBadgeVariant = (event: string) => {
    if (event.includes("FAIL") || event.includes("REVOKED")) return "destructive";
    if (event.includes("SUCCESS") || event.includes("UNLOCKED")) return "success";
    if (event.includes("ROLE") || event.includes("STATUS")) return "warning";
    return "secondary";
  };

  return (
    <div className="space-y-5 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            Security audit trail
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            An immutable record of sign-ins, administrative changes, and session events.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="h-8 shrink-0 self-start rounded-md border-border px-3 text-sm font-medium sm:self-auto"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 leading-relaxed">{error}</span>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
        </div>
      )}

      {/* Query controls */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-3.5 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-5">
          <div className="space-y-1.5">
            <label htmlFor="audit-event" className="block text-[11px] text-muted-foreground">
              Event
            </label>
            <select
              id="audit-event"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="h-8 rounded-md border border-border/70 bg-background/60 px-2.5 font-mono text-[11px] focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {AUDIT_EVENTS.map((evt) => (
                <option key={evt} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="audit-limit" className="block text-[11px] text-muted-foreground">
              Rows
            </label>
            <select
              id="audit-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-8 rounded-md border border-border/70 bg-background/60 px-2.5 font-mono text-[11px] focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-[11px] text-muted-foreground">Quick filters</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_EVENTS.map((evt) => (
              <button
                key={evt}
                type="button"
                onClick={() => setSelectedEvent(evt)}
                aria-pressed={selectedEvent === evt}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
                  selectedEvent === evt
                    ? "border-primary/40 bg-primary/[0.06] text-primary"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {evt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger surface */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-foreground">
              Activity records
            </h2>
          </div>
          <Badge variant="outline" className="self-start rounded-md px-2 py-0 font-mono text-[11px] text-muted-foreground sm:self-auto">
            {logs.length} events
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-9 px-3" />
                <TableHead className="w-[170px] py-2.5 font-sans normal-case tracking-normal">Timestamp</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Event</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Principal</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Client IP</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                    {loading ? "Reading the audit trail" : "No events recorded for this filter."}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const rawIp = (log.ip_address || log.ip || "—").replace(/\/32$/, "");
                  const timestampStr = log.ts || (log as any).created_at || (log as any).timestamp;
                  const details = (log.details as Record<string, any>) || {};

                  const actorId = log.actor_user_id || details.actor_user_id || details.user_id;
                  const targetId = log.target_user_id || details.target_user_id;

                  let primaryEmail: string | null =
                    (actorId && usersMap[actorId]) ||
                    details.actor_email ||
                    details.email ||
                    details.user_email ||
                    null;

                  let primaryId: string | null = actorId || null;

                  if (!primaryEmail && primaryId && primaryId.includes("@")) {
                    primaryEmail = primaryId;
                    primaryId = usersMap[primaryId.toLowerCase().trim()] || null;
                  }

                  if (primaryEmail && !primaryId && usersMap[primaryEmail.toLowerCase().trim()]) {
                    primaryId = usersMap[primaryEmail.toLowerCase().trim()] || null;
                  }

                  const targetEmail: string | null =
                    (targetId && usersMap[targetId]) ||
                    details.target_email ||
                    null;

                  const hasDifferentTarget = Boolean(
                    targetId &&
                    primaryId &&
                    targetId !== primaryId
                  );

                  const eventVariant = getEventBadgeVariant(log.event);

                  return (
                    <React.Fragment key={log.id}>
                      <TableRow
                        onClick={() => toggleExpand(log.id)}
                        className={`cursor-pointer border-b border-border/60 hover:bg-muted/25 ${
                          isExpanded ? "bg-muted/25" : ""
                        }`}
                      >
                        <TableCell className="w-9 px-3">
                          <button
                            type="button"
                            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </TableCell>

                        <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {formatDateTime(timestampStr)}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 font-mono text-[10px] text-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              eventVariant === "destructive"
                                ? "bg-destructive"
                                : eventVariant === "success"
                                ? "bg-emerald-500"
                                : eventVariant === "warning"
                                ? "bg-amber-500"
                                : "bg-muted-foreground/50"
                            }`} />
                            {log.event}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-[11px]">
                          {primaryEmail || primaryId ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="max-w-[220px] truncate font-sans text-[13px] font-medium text-foreground"
                                  title={primaryEmail || primaryId || "Principal"}
                                >
                                  {primaryEmail || primaryId}
                                </span>
                                {primaryEmail && (
                                  <CopyButton
                                    value={primaryEmail}
                                    className="h-4 rounded px-1 text-[9px] opacity-70 hover:opacity-100"
                                  />
                                )}
                              </div>

                              {primaryId && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="text-[10px] text-muted-foreground/70">ID</span>
                                  <span className="max-w-[150px] truncate" title={primaryId}>
                                    {primaryId}
                                  </span>
                                  <CopyButton
                                    value={primaryId}
                                    className="h-4 rounded px-1 text-[9px] opacity-70 hover:opacity-100"
                                  />
                                </div>
                              )}

                              {hasDifferentTarget && (
                                <div className="mt-0.5 flex flex-col gap-0.5 border-t border-border/60 pt-1 text-[11px]">
                                  <span className="text-[10px] text-muted-foreground">Target</span>
                                  <span
                                    className="max-w-[200px] truncate font-medium text-foreground/90"
                                    title={targetEmail || targetId || ""}
                                  >
                                    {targetEmail || targetId}
                                  </span>
                                  {targetId && targetEmail && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <span className="text-[10px] text-muted-foreground/70">ID</span>
                                      <span className="max-w-[130px] truncate">{targetId}</span>
                                      <CopyButton
                                        value={targetId}
                                        className="h-3.5 rounded px-1 text-[8px] opacity-70 hover:opacity-100"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-sans text-[13px] italic text-muted-foreground">
                              Anonymous or system
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap font-mono text-[11px] text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                            {rawIp}
                          </span>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={5} className="p-3">
                            <div className="overflow-hidden rounded-md border border-border/70 bg-background/60">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2.5">
                                <span className="font-display text-[13px] font-semibold text-foreground">
                                  Event payload
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-muted-foreground">Log {log.id}</span>
                                  <CopyButton
                                    value={JSON.stringify(log, null, 2)}
                                    className="h-6 rounded px-2 text-[10px]"
                                  />
                                </div>
                              </div>
                              <pre className="overflow-x-auto bg-muted/25 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                                {JSON.stringify(log.details || log, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
