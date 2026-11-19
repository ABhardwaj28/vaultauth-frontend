import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronRight, AlertCircle, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { AuditLogItem } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
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
            className="h-8 text-xs font-mono"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-mono">Event Type:</span>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {AUDIT_EVENTS.map((evt) => (
              <option key={evt} value={evt}>
                {evt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-mono">Fetch Limit:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={25}>25 Events</option>
            <option value={50}>50 Events</option>
            <option value={100}>100 Events</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Audit Event Records
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Click any row to inspect serialized metadata payload.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {logs.length} Recorded Events
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Actor User ID</TableHead>
                <TableHead>Target User ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">
                    {loading ? "Inspecting audit storage..." : "No audit events match the filter."}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <TableRow
                        onClick={() => toggleExpand(log.id)}
                        className="cursor-pointer select-none"
                      >
                        <TableCell className="p-2 text-center text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          {formatDateTime(log.ts)}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getEventBadgeVariant(log.event)} className="text-[10px]">
                            {log.event}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.actor_user_id ? (
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">{log.actor_user_id}</span>
                              <CopyButton value={log.actor_user_id} className="h-5 px-1 text-[10px]" />
                            </div>
                          ) : (
                            <span className="italic">SYSTEM</span>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.target_user_id ? (
                            <div className="flex items-center">
                              <span className="truncate max-w-[120px]">{log.target_user_id}</span>
                              <CopyButton value={log.target_user_id} className="h-5 px-1 text-[10px]" />
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1 opacity-70" />
                            {log.ip_address || log.ip || "127.0.0.1"}
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Expandable JSON Detail Drawer */}
                      {isExpanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={6} className="p-3">
                            <div className="rounded-md border border-border bg-background p-3 text-xs font-mono space-y-1">
                              <div className="flex items-center justify-between pb-1 border-b border-border text-[11px] text-muted-foreground">
                                <span>Event Payload Details</span>
                                <CopyButton
                                  value={JSON.stringify(log.details || log, null, 2)}
                                  label="Copy JSON"
                                />
                              </div>
                              <pre className="text-[11px] text-foreground overflow-x-auto pt-2 max-h-48 leading-relaxed">
                                {JSON.stringify(log.details || { event: log.event, id: log.id }, null, 2)}
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
        </CardContent>
      </Card>
    </div>
  );
}
