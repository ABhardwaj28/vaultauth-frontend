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
  "MFA_CHALLENGE_ISSUED",
  "MFA_VERIFIED",
  "SESSION_REVOKED",
  "OAUTH_CLIENT_CREATED",
  "OAUTH_CLIENT_REVOKED",
  "OAUTH_TOKEN_ISSUED",
  "USER_UNLOCKED",
  "USER_STATUS_CHANGED",
  "ROLE_CHANGED",
];

const QUICK_EVENTS = ["All", "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "SESSION_REVOKED", "ROLE_CHANGED"];

function Metric({ label, value, note, accent }: { label: string; value: string | number; note?: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
      {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
    </div>
  );
}

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  const requestBars = (() => {
    const now = new Date();
    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0);
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(currentHour);
      hour.setHours(currentHour.getHours() - (23 - i));
      return { hour, count: 0 };
    });
    for (const log of logs) {
      const ts = log.ts || (log as { created_at?: string }).created_at;
      if (!ts) continue;
      const time = new Date(ts).getTime();
      if (Number.isNaN(time)) continue;
      const index = buckets.findIndex((bucket) => time >= bucket.hour.getTime() && time < bucket.hour.getTime() + 3600000);
      if (index >= 0 && buckets[index]) buckets[index].count += 1;
    }
    const peak = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({ ...b, height: Math.max(4, (b.count / peak) * 100) }));
  })();

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
      // the audit trail must never be blocked by a directory failure
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData] = await Promise.all([
        api.getAuditLogs({ event: selectedEvent !== "All" ? selectedEvent : undefined, limit: 100 }),
        fetchUsers(),
      ]);
      setLogs(logsData);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to query the audit trail.");
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, fetchUsers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const tableLogs = [...logs]
    .sort((a, b) => {
      const ta = new Date(a.ts || (a as { created_at?: string }).created_at || "").getTime();
      const tb = new Date(b.ts || (b as { created_at?: string }).created_at || "").getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    })
    .slice(0, 25);

  const counts = {
    success: logs.filter((l) => l.event.includes("SUCCESS") || l.event.includes("VERIFIED") || l.event.includes("UNLOCKED")).length,
    failures: logs.filter((l) => l.event.includes("FAILED") || l.event.includes("REVOKED")).length,
    peak: Math.max(0, ...requestBars.map((b) => b.count)),
  };

  const toggleExpand = (id: number | string) => setExpandedId((prev) => (prev === id ? null : id));

  const badgeTone = (event: string) => {
    if (event.includes("FAIL") || event.includes("REVOKED")) return { dot: "bg-destructive", text: "text-destructive" };
    if (event.includes("SUCCESS") || event.includes("VERIFIED") || event.includes("UNLOCKED")) return { dot: "bg-success", text: "text-success" };
    if (event.includes("ROLE") || event.includes("STATUS")) return { dot: "bg-warning", text: "text-warning" };
    return { dot: "bg-muted-foreground/40", text: "text-foreground" };
  };

  const eventPill = (event: string) => {
    const tone = badgeTone(event);
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${tone.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
        {event}
      </span>
    );
  };

  const resolvePrincipal = (log: AuditLogItem) => {
    const details = (log.details as Record<string, string>) || {};
    const actorId = log.actor_user_id || details.actor_user_id || details.user_id;
    let email: string | null = (actorId && usersMap[actorId]) || details.actor_email || details.email || details.user_email || null;
    let id: string | null = actorId || null;
    if (!email && id?.includes("@")) {
      email = id;
      id = usersMap[id.toLowerCase().trim()] || null;
    }
    if (email && !id) id = usersMap[email.toLowerCase().trim()] || null;
    const targetId = log.target_user_id || details.target_user_id;
    const targetEmail = (targetId && usersMap[targetId]) || details.target_email || null;
    return {
      email,
      id,
      target: targetId && id && targetId !== id ? { id: targetId, email: targetEmail } : null,
    };
  };

  const rawIp = (log: AuditLogItem) => (log.ip_address || log.ip || "—").replace(/\/32$/, "");
  const timestamp = (log: AuditLogItem) => log.ts || (log as { created_at?: string }).created_at || "";
  const payload = (log: AuditLogItem) => JSON.stringify(log.details || log, null, 2);

  return (
    <div className="space-y-4 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
            Security audit trail
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            An immutable record of sign-ins, administrative changes and session events.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}
          className="h-8 shrink-0 self-start rounded border-border px-3 text-[13px] sm:self-auto">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded border border-destructive/30 bg-destructive/[0.05] px-3 py-2 text-[13px]">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Query controls */}
      <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <label htmlFor="audit-event" className="block text-[10px] uppercase tracking-wider text-muted-foreground">Event</label>
          <select id="audit-event" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}
            className="h-8 rounded border border-border/70 bg-background/60 px-2 font-mono text-[11px] focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring">
            {AUDIT_EVENTS.map((evt) => <option key={evt} value={evt}>{evt}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Quick filters</span>
          <div className="flex flex-wrap gap-1">
            {QUICK_EVENTS.map((evt) => (
              <button key={evt} type="button" onClick={() => setSelectedEvent(evt)} aria-pressed={selectedEvent === evt}
                className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                  selectedEvent === evt
                    ? "border-primary/40 bg-primary/[0.07] text-foreground"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                }`}>
                {evt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
        <Metric label="Events" value={logs.length} note="loaded" accent />
        <Metric label="Successful" value={counts.success} />
        <Metric label="Flagged" value={counts.failures} />
        <Metric label="Peak hour" value={counts.peak} note="requests" />
      </div>

      {/* Hourly volume */}
      <div className="rounded border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">Access requests</h2>
            <p className="text-[11px] text-muted-foreground">Hourly · last 24 hours</p>
          </div>
          <Badge variant="outline" className="rounded px-1.5 py-0 font-mono text-[10px] text-muted-foreground">
            {tableLogs.length} of {logs.length}
          </Badge>
        </div>
        <div className="px-4 py-4">
          <div className="flex h-20 items-stretch gap-1 sm:gap-1.5" role="img" aria-label="Hourly access request volume over the last 24 hours">
            {requestBars.map((bar, index) => (
              <div key={bar.hour.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-full w-full items-end">
                  <div className={`w-full rounded-sm ${index === 23 ? "bg-primary" : "bg-primary/35"}`}
                    style={{ height: `${bar.height}%` }}
                    title={`${bar.hour.getHours().toString().padStart(2, "0")}:00 — ${bar.count} events`} />
                </div>
                <span className="h-3 w-full text-center font-mono text-[9px] text-muted-foreground">
                  {index % 6 === 0 ? bar.hour.getHours().toString().padStart(2, "0") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="overflow-hidden rounded border border-border border-t-2 border-t-primary/80 bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Activity records</h2>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">Most recent 25</span>
        </div>

        {/* Desktop ledger */}
        <div className="hidden md:block">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-9 px-2 py-3" />
                <TableHead className="w-[150px] py-3 font-sans normal-case tracking-normal">Timestamp</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Event</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Principal</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Client IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-[13px] text-muted-foreground">
                  {loading ? "Reading the audit trail" : "No events recorded for this filter."}
                </TableCell></TableRow>
              ) : tableLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const principal = resolvePrincipal(log);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow onClick={() => toggleExpand(log.id)} className={`cursor-pointer border-b border-border/60 hover:bg-muted/25 ${isExpanded ? "bg-muted/25" : ""}`}>
                      <TableCell className="w-9 px-2 py-3">
                        <span className="text-muted-foreground">{isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-muted-foreground">{formatDateTime(timestamp(log))}</TableCell>
                      <TableCell className="py-3">{eventPill(log.event)}</TableCell>
                      <TableCell className="py-3 font-mono text-[10px]">
                        {principal.email || principal.id ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="max-w-[200px] truncate font-sans text-[12px] font-medium text-foreground">{principal.email || principal.id}</span>
                              {principal.email && <CopyButton value={principal.email} className="h-4 rounded px-1 text-[9px] opacity-70" />}
                            </div>
                            {principal.id && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="text-[9px]">ID</span>
                                <span className="max-w-[130px] truncate">{principal.id}</span>
                                <CopyButton value={principal.id} className="h-4 rounded px-1 text-[9px] opacity-70" />
                              </div>
                            )}
                            {principal.target && (
                              <div className="mt-0.5 border-t border-border/60 pt-1 text-[10px]">
                                <span className="text-muted-foreground">Target </span>
                                <span className="font-medium text-foreground">{principal.target.email || principal.target.id}</span>
                              </div>
                            )}
                          </div>
                        ) : <span className="font-sans text-[12px] italic text-muted-foreground">Anonymous or system</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-foreground">
                        <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" />{rawIp(log)}</span>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={5} className="p-3">
                          <div className="overflow-hidden rounded border border-border/70 bg-background/60">
                            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                              <span className="text-[12px] font-semibold">Event payload</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">Log {log.id}</span>
                                <CopyButton value={payload(log)} className="h-6 rounded px-2 text-[10px]" />
                              </div>
                            </div>
                            <pre className="max-h-52 overflow-auto bg-muted/25 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">{payload(log)}</pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Compact cards on small screens */}
        <div className="divide-y divide-border md:hidden">
          {tableLogs.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              {loading ? "Reading the audit trail" : "No events recorded for this filter."}
            </div>
          ) : tableLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const principal = resolvePrincipal(log);
            return (
              <div key={log.id}>
                <button type="button" onClick={() => toggleExpand(log.id)} className="flex w-full items-start gap-2.5 p-3 text-left hover:bg-muted/25">
                  <span className="mt-0.5 text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">{eventPill(log.event)}</div>
                    <p className="truncate text-[12px] font-medium text-foreground">{principal.email || principal.id || "Anonymous or system"}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                      <span>{formatDateTime(timestamp(log))}</span>
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{rawIp(log)}</span>
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold">Event payload</span>
                      <CopyButton value={payload(log)} className="h-6 rounded px-2 text-[10px]" />
                    </div>
                    <pre className="max-h-52 overflow-auto rounded border border-border/70 bg-background/60 p-2.5 font-mono text-[10px] leading-relaxed text-muted-foreground">{payload(log)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
