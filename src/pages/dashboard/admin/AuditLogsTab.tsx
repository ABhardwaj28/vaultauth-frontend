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

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        event: selectedEvent !== "All" ? selectedEvent : undefined,
        limit,
      });
      setLogs(data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to query security audit trail.");
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, limit]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Security Audit Trail
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable system audit logs recording authentication events, administrative actions, and authorization grants.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-8 px-3 text-xs font-medium rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-medium">Event Type:</span>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background/50 focus:bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
          >
            {AUDIT_EVENTS.map((evt) => (
              <option key={evt} value={evt}>
                {evt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-medium">Fetch Limit:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-background/50 focus:bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
          >
            <option value={25}>25 Entries</option>
            <option value={50}>50 Entries</option>
            <option value={100}>100 Entries</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table Card */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none">
        <div className="p-5 sm:p-6 border-b border-border/80 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Activity Records
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Timestamped security operations with IP attribution and telemetry details.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 rounded-md">
            {logs.length} Recorded
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-transparent">
                <TableHead className="w-10 py-3"></TableHead>
                <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Event Action</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Principal User</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Client IP Address</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
                    {loading ? "Streaming security audit records..." : "No audit trail records found."}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const rawIp = (log.ip_address || log.ip || "—").replace(/\/32$/, "");
                  const timestampStr = log.ts || (log as any).created_at || (log as any).timestamp;
                  const principal =
                    log.actor_user_id ||
                    log.target_user_id ||
                    (log.details && (log.details.email || log.details.user_id || log.details.user_email)) ||
                    "Anonymous / System";

                  return (
                    <React.Fragment key={log.id}>
                      <TableRow
                        onClick={() => toggleExpand(log.id)}
                        className={`cursor-pointer transition-colors border-b border-border/60 hover:bg-muted/20 ${
                          isExpanded ? "bg-muted/20" : ""
                        }`}
                      >
                        <TableCell className="w-10 px-3">
                          <button
                            type="button"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(timestampStr)}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getEventBadgeVariant(log.event)} className="rounded-md text-[10px] uppercase font-semibold">
                            {log.event}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-foreground">
                          <span className="truncate max-w-[220px] block">
                            {String(principal)}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-foreground">
                          <span className="flex items-center space-x-1.5">
                            <Globe className="h-3 w-3 text-primary opacity-80 shrink-0" />
                            <span>{rawIp}</span>
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Expandable JSON Detail View */}
                      {isExpanded && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/60">
                          <TableCell colSpan={5} className="p-4">
                            <div className="rounded-lg border border-border/80 bg-background/60 p-4 space-y-3 font-mono text-xs">
                              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider font-sans">
                                  Audit Payload & Event Metadata
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-muted-foreground text-[11px]">Log ID: {log.id}</span>
                                  <CopyButton
                                    value={JSON.stringify(log, null, 2)}
                                    className="h-6 px-2 text-[10px] rounded"
                                  />
                                </div>
                              </div>

                              <pre className="text-[11px] leading-relaxed text-muted-foreground overflow-x-auto p-2 rounded-md bg-muted/30">
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
