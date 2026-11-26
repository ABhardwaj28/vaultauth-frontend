import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Laptop,
  Smartphone,
  Globe,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

interface UserSessionGroup {
  userId: string;
  email?: string;
  latestSession: SessionItem;
  allSessions: SessionItem[];
}

function getSessionTimestamp(s: SessionItem): number {
  const ts = s.last_active_at || s.created_at || s.expires_at;
  if (!ts) return 0;
  const time = new Date(ts).getTime();
  return isNaN(time) ? 0 : time;
}

function Metric({ label, value, note, accent }: { label: string; value: string | number; note?: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
      {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
    </div>
  );
}

export function GlobalSessionsTab() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.getAdminUsers({ limit: 100, fetchAll: true });
      const list = res.users || res.items || [];
      const map: Record<string, string> = {};
      for (const u of list) if (u.id && u.email) map[u.id] = u.email;
      setUserMap((prev) => ({ ...prev, ...map }));
    } catch {
      // directory enrichment must never block the session view
    }
  }, []);

  const fetchGlobalSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      void fetchUsers();
      const data = await api.getGlobalSessions(100);
      const now = Date.now();
      setSessions((data || []).filter((s) => {
        const isActive = !s.status || s.status.toUpperCase() === "ACTIVE";
        const notRevoked = !(s as { revoked_at?: string }).revoked_at && !(s as { revoke_reason?: string }).revoke_reason;
        const exp = s.idle_expires_at || s.expires_at || s.absolute_expires_at;
        const notExpired = !exp || new Date(exp).getTime() > now;
        return isActive && notRevoked && notExpired;
      }));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load global active sessions.");
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchGlobalSessions();
  }, [fetchGlobalSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    setMessage(null);
    setError(null);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage("Session terminated. Token rejected on the next request.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "";
      if (/not exist|not found|revoked/i.test(msg)) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setMessage("Session was already inactive and has been removed.");
      } else {
        setError(msg || "Failed to terminate session.");
      }
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllForUser = async (userId: string, userSessions: SessionItem[]) => {
    setRevokingUser(userId);
    setMessage(null);
    setError(null);
    try {
      for (const s of userSessions) await api.revokeSession(s.id);
      setMessage(`Terminated all ${userSessions.length} session(s) for this user.`);
      setSessions((prev) => prev.filter((s) => (s.user_id || s.email || s.user_email || "anonymous_user") !== userId));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate sessions for this user.");
    } finally {
      setRevokingUser(null);
    }
  };

  const groupedSessions = useMemo<UserSessionGroup[]>(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const key = session.user_id || session.email || session.user_email || "anonymous_user";
      map.set(key, [...(map.get(key) || []), session]);
    }
    const groups: UserSessionGroup[] = Array.from(map.entries())
      .filter(([, list]) => list.length > 0)
      .map(([userId, list]) => {
        const sorted = [...list].sort((a, b) => {
          if (a.is_current || a.current) return -1;
          if (b.is_current || b.current) return 1;
          return getSessionTimestamp(b) - getSessionTimestamp(a);
        });
        const withEmail = list.find((s) => s.email || s.user_email);
        return {
          userId,
          email: withEmail?.email || withEmail?.user_email || userMap[userId],
          latestSession: sorted[0]!,
          allSessions: sorted,
        };
      });

    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter((g) =>
      g.userId.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      g.allSessions.some((s) =>
        (s.ip || s.ip_address || "").toLowerCase().includes(q) ||
        (s.device || s.user_agent || "").toLowerCase().includes(q) ||
        parseUserAgent(s.device || s.user_agent).browser.toLowerCase().includes(q)
      )
    );
  }, [sessions, searchQuery, userMap]);

  const uniqueUserCount = useMemo(
    () => new Set(sessions.map((s) => s.user_id || s.email || s.user_email || "anonymous_user")).size,
    [sessions]
  );
  const multiDeviceCount = groupedSessions.filter((g) => g.allSessions.length > 1).length;
  const currentCount = sessions.filter((s) => s.current || s.is_current).length;

  const toggleUserExpand = (userId: string) => setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));

  const toggleAllExpand = () => {
    const allExpanded = groupedSessions.length > 0 && groupedSessions.every((g) => expandedUsers[g.userId]);
    if (allExpanded) {
      setExpandedUsers({});
    } else {
      setExpandedUsers(Object.fromEntries(groupedSessions.map((g) => [g.userId, true])));
    }
  };

  const terminateAllButton = (group: UserSessionGroup) => {
    const isRevoking = revokingUser === group.userId;
    const count = group.allSessions.length;
    return (
      <Button variant="ghost" size="sm" disabled={isRevoking}
        onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
        className="h-7 w-7 rounded border border-border/70 px-0 text-[11px] text-muted-foreground hover:border-destructive/40 hover:bg-destructive/[0.06] hover:text-destructive sm:w-auto sm:px-2"
        title="Terminate all sessions for this user"
        aria-label="Terminate all sessions for this user">
        <Trash2 className="h-3 w-3 sm:mr-1" />
        <span className="hidden sm:inline">
          {isRevoking ? "Terminating" : `Terminate all (${count})`}
        </span>
        {isRevoking && <span className="sm:hidden">...</span>}
      </Button>
    );
  };

  const sessionRow = (session: SessionItem, sIdx: number, isCurrent: boolean) => {
    const rawUa = session.device || session.user_agent || "Client device";
    const rawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
    const parsed = parseUserAgent(rawUa);
    const isRevoking = revokingId === session.id;
    return {
      rawUa,
      rawIp,
      parsed,
      device: (
        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded border border-border/70 bg-muted/40 p-1 text-muted-foreground">
            {parsed.isMobile ? <Smartphone className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help whitespace-nowrap text-[12px] font-medium text-foreground">{parsed.browser}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs break-all font-mono text-[10px]">{rawUa}</TooltipContent>
          </Tooltip>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 rounded border border-border/70 bg-background/60 px-1.5 py-0 text-[10px]">
              <span className="h-1 w-1 rounded-full bg-success" />Current
            </span>
          )}
        </div>
      ),
      action: (
        <Button variant="ghost" size="sm" disabled={isRevoking} onClick={() => handleRevoke(session.id)}
          className="h-7 rounded border border-border/70 px-2 text-[11px] text-muted-foreground hover:border-destructive/40 hover:bg-destructive/[0.06] hover:text-destructive"
          title="Terminate this session">
          <Trash2 className="mr-1 h-3 w-3" />
          {isRevoking ? "..." : "Terminate"}
        </Button>
      ),
      key: session.id || sIdx,
      lastActive: formatRelativeTime(session.last_active_at || session.created_at),
      signedIn: session.created_at ? formatDateTime(session.created_at) : "—",
      expires: session.expires_at ? formatDateTime(session.expires_at) : "Active",
    };
  };

  return (
    <div className="space-y-4 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
            Global active sessions
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Live authentication grants across the directory, with immediate remote revocation.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          {groupedSessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleAllExpand}
              className="h-8 rounded px-2 text-[12px] font-medium text-primary hover:text-foreground">
              {groupedSessions.every((g) => expandedUsers[g.userId]) ? "Collapse all" : "Expand all"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchGlobalSessions} disabled={loading}
            className="h-8 rounded border-border px-3 text-[13px]">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2.5 rounded border border-border bg-card px-3 py-2 text-[13px]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="flex-1">{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 rounded border border-destructive/30 bg-destructive/[0.05] px-3 py-2 text-[13px]">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
        <Metric label="Active users" value={uniqueUserCount} accent />
        <Metric label="Live sessions" value={sessions.length} />
        <Metric label="Multi-device" value={multiDeviceCount} note="users" />
        <Metric label="This device" value={currentCount} />
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search user, email, IP or browser" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded border-border/70 bg-background/60 pl-8 text-[13px] focus:bg-card" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {groupedSessions.length} {groupedSessions.length === 1 ? "identity" : "identities"} · {sessions.length} grants
        </span>
      </div>

      {/* Grouped ledger */}
      <TooltipProvider>
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded border border-border bg-card p-10 text-[13px] text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" /> Reading the session directory
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded border border-border bg-card p-10 text-center">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <span className="text-[13px] font-medium text-foreground">
              {searchQuery ? "No sessions match this search." : "No active sessions found."}
            </span>
            <span className="text-[11px] text-muted-foreground">Only valid, unexpired grants appear here.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedSessions.map((group) => {
              const isExpanded = Boolean(expandedUsers[group.userId]);
              const latest = group.latestSession;
              const rawIp = (latest.ip || latest.ip_address || "—").replace(/\/32$/, "");
              const emailDisplay = group.email || userMap[group.userId] || null;
              const rows = group.allSessions.map((s, i) => sessionRow(s, i, Boolean(s.current ?? s.is_current ?? (i === 0 && group.allSessions.length === 1))));

              return (
                <div key={group.userId} className="relative overflow-hidden rounded border border-border bg-card pl-[3px]">
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-primary/80" aria-hidden="true" />
                  <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                    <button type="button" onClick={() => toggleUserExpand(group.userId)} className="shrink-0 text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleUserExpand(group.userId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleUserExpand(group.userId);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/70 bg-muted/40 font-display text-[10px] font-semibold text-muted-foreground">
                        {((emailDisplay || group.userId).split("@")[0] || "?").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="max-w-[220px] truncate text-[12px] font-medium text-foreground sm:max-w-[260px]">{emailDisplay || group.userId}</span>
                          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
                            <CopyButton value={group.userId} className="h-4 rounded px-1 text-[9px]" />
                          </span>
                          <span className="hidden shrink-0 rounded border border-border/70 bg-background/60 px-1.5 py-0 font-mono text-[10px] text-muted-foreground sm:inline">
                            {group.allSessions.length} {group.allSessions.length === 1 ? "session" : "sessions"}
                          </span>
                        </span>
                        <span className="max-w-[220px] truncate font-mono text-[10px] text-muted-foreground sm:max-w-[260px]">{group.userId}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <div className="hidden items-center gap-3 font-mono text-[10px] text-muted-foreground lg:flex">
                        <span className="flex items-center text-foreground/80"><Globe className="mr-1 h-3 w-3" />{rawIp}</span>
                        <span className="h-3 w-px bg-border" />
                        <span>{formatRelativeTime(latest.last_active_at || latest.created_at)}</span>
                      </div>
                      {terminateAllButton(group)}
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      {/* Desktop session table */}
                      <div className="hidden md:block">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                              <TableHead className="py-3 font-sans normal-case tracking-normal">Browser</TableHead>
                              <TableHead className="py-3 font-sans normal-case tracking-normal">IP address</TableHead>
                              <TableHead className="py-3 font-sans normal-case tracking-normal">Last active</TableHead>
                              <TableHead className="py-3 font-sans normal-case tracking-normal">Signed in</TableHead>
                              <TableHead className="py-3 font-sans normal-case tracking-normal">Expires</TableHead>
                              <TableHead className="py-3 text-right font-sans normal-case tracking-normal">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row) => (
                              <TableRow key={row.key} className="border-b border-border/60 hover:bg-muted/25">
                                <TableCell className="py-3">{row.device}</TableCell>
                                <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-foreground">
                                  <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" />{row.rawIp}</span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-muted-foreground">{row.lastActive}</TableCell>
                                <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-muted-foreground">{row.signedIn}</TableCell>
                                <TableCell className="whitespace-nowrap py-3 font-mono text-[10px] text-muted-foreground">{row.expires}</TableCell>
                                <TableCell className="whitespace-nowrap py-2 text-right">{row.action}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Compact session cards on small screens */}
                      <div className="divide-y divide-border/60 md:hidden">
                        {rows.map((row) => (
                          <div key={row.key} className="flex items-start justify-between gap-2 p-3">
                            <div className="min-w-0 space-y-1.5">
                              {row.device}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{row.rawIp}</span>
                                <span>Active {row.lastActive}</span>
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">Expires {row.expires}</div>
                            </div>
                            <div className="shrink-0">{row.action}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}
