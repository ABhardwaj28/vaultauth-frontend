import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Laptop,
  Smartphone,
  Globe,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  User,
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

  // Fetch full directory to map user_id -> corporate email
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.getAdminUsers({ limit: 100, fetchAll: true });
      const list = res.users || res.items || [];
      const map: Record<string, string> = {};
      for (const u of list) {
        if (u.id && u.email) {
          map[u.id] = u.email;
        }
      }
      setUserMap((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, []);

  const fetchGlobalSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The user directory only enriches emails — it must never block or fail
      // the sessions view. Fetch it independently and ignore failures.
      void fetchUsers();
      const data = await api.getGlobalSessions(100);
      const now = Date.now();
      const activeSessions = (data || []).filter((s) => {
        const isStatusActive = !s.status || s.status.toUpperCase() === "ACTIVE";
        const notRevoked = !(s as any).revoked_at && !(s as any).revoke_reason;
        const expTime = s.idle_expires_at || s.expires_at || s.absolute_expires_at;
        const notExpired = !expTime || new Date(expTime).getTime() > now;
        return isStatusActive && notRevoked && notExpired;
      });
      setSessions(activeSessions);
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
      setMessage("Session terminated. Security token expunged immediately from directory.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || "";
      if (
        errMsg.toLowerCase().includes("not exist") ||
        errMsg.toLowerCase().includes("not found") ||
        errMsg.toLowerCase().includes("revoked")
      ) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setMessage("Session is no longer active and has been expunged.");
      } else {
        setError(errMsg || "Failed to terminate session.");
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
      for (const s of userSessions) {
        await api.revokeSession(s.id);
      }
      setMessage(`Terminated all ${userSessions.length} active session(s) for user.`);
      setSessions((prev) =>
        prev.filter((s) => (s.user_id || s.email || s.user_email || "anonymous_user") !== userId)
      );
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate all sessions for user.");
    } finally {
      setRevokingUser(null);
    }
  };

  // Group sessions strictly by user_id
  const groupedSessions = useMemo<UserSessionGroup[]>(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const userId = session.user_id || session.email || session.user_email || "anonymous_user";
      const existing = map.get(userId) || [];
      existing.push(session);
      map.set(userId, existing);
    }

    const groups: UserSessionGroup[] = Array.from(map.entries())
      .filter(([_, userSessions]) => userSessions.length > 0)
      .map(([userId, userSessions]) => {
        const sorted = [...userSessions].sort((a, b) => {
          if (a.is_current || a.current) return -1;
          if (b.is_current || b.current) return 1;
          return getSessionTimestamp(b) - getSessionTimestamp(a);
        });

        const latestSession = sorted[0]!;
        const email =
          userSessions.find((s) => s.email || s.user_email)?.email ||
          userSessions.find((s) => s.email || s.user_email)?.user_email ||
          userMap[userId];

        return {
          userId,
          email,
          latestSession,
          allSessions: sorted,
        };
      });

    if (!searchQuery.trim()) return groups;

    const q = searchQuery.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.userId.toLowerCase().includes(q) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        g.allSessions.some(
          (s) =>
            (s.ip || s.ip_address || "").toLowerCase().includes(q) ||
            (s.device || s.user_agent || "").toLowerCase().includes(q) ||
            parseUserAgent(s.device || s.user_agent).browser.toLowerCase().includes(q)
        )
    );
  }, [sessions, searchQuery, userMap]);

  const uniqueUserCount = useMemo(() => {
    return new Set(sessions.map((s) => s.user_id || s.email || s.user_email || "anonymous_user")).size;
  }, [sessions]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleAllExpand = () => {
    const allExpanded = groupedSessions.length > 0 && groupedSessions.every((g) => expandedUsers[g.userId]);
    if (allExpanded) {
      setExpandedUsers({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groupedSessions) {
        next[g.userId] = true;
      }
      setExpandedUsers(next);
    }
  };

  return (
    <div className="space-y-4 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            Global active sessions
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Live authentication grants across the directory, with immediate remote revocation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          {groupedSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllExpand}
              className="h-8 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              {groupedSessions.every((g) => expandedUsers[g.userId])
                ? "Collapse all"
                : "Expand all"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchGlobalSessions}
            disabled={loading}
            className="h-8 rounded-md border-border px-3 text-sm font-medium"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notices */}
      {message && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 leading-relaxed">{message}</span>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 leading-relaxed">{error}</span>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
        </div>
      )}

      {/* Search, counts, and summary strip */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user, email, IP, or browser"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-md border-border/70 bg-background/60 pl-9 text-sm focus:bg-card"
            />
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span>{uniqueUserCount} {uniqueUserCount === 1 ? "user" : "users"}</span>
            <span className="h-3 w-px bg-border" />
            <span>{sessions.length} live {sessions.length === 1 ? "session" : "sessions"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5 pr-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">Active users</span>
              <span className="font-display text-base font-semibold leading-tight text-foreground">{uniqueUserCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-l border-border/70 px-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
              <Laptop className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">Live sessions</span>
              <span className="font-display text-base font-semibold leading-tight text-foreground">{sessions.length}</span>
            </div>
          </div>
          <div className="ml-auto border-l border-border/70 py-1 pl-5 text-[11px] text-muted-foreground">
            Grouped by user identity
          </div>
        </div>
      </div>

      {/* Grouped user surfaces */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-card p-10 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          Reading the session directory
        </div>
      ) : groupedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <ShieldAlert className="mb-0.5 h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {searchQuery ? "No sessions match this search." : "No active sessions found."}
          </span>
          <span className="text-[12px]">Only valid, unexpired grants appear here.</span>
        </div>
      ) : (
        <TooltipProvider>
          <div className="space-y-2">
            {groupedSessions.map((group) => {
              const isExpanded = Boolean(expandedUsers[group.userId]);
              const latest = group.latestSession;
              const hasMultiple = group.allSessions.length > 1;
              const isRevokingThisUser = revokingUser === group.userId;

              const rawIp = (latest.ip || latest.ip_address || "—").replace(/\/32$/, "");
              const emailDisplay = group.email || userMap[group.userId] || null;

              return (
                <div
                  key={group.userId}
                  className="overflow-hidden rounded-md border border-border bg-card"
                >
                  <div
                    onClick={() => toggleUserExpand(group.userId)}
                    className="flex cursor-pointer select-none items-center justify-between gap-3 border-b border-border/70 bg-muted/20 px-3.5 py-3 transition-colors hover:bg-muted/30 sm:px-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="rounded-sm p-0.5 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 font-display text-[11px] font-semibold text-muted-foreground">
                        {((emailDisplay || group.userId).split("@")[0] || "?").slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="max-w-[260px] truncate text-[13px] font-medium text-foreground"
                            title={emailDisplay || group.userId}
                          >
                            {emailDisplay || group.userId}
                          </span>
                          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
                            <CopyButton
                              value={group.userId}
                              className="h-4 rounded px-1 text-[9px]"
                            />
                          </span>
                          <span className="shrink-0 rounded-md border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {group.allSessions.length} {group.allSessions.length === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {group.userId}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hidden items-center gap-3 font-mono text-[11px] text-muted-foreground md:flex">
                        <span className="flex items-center text-foreground/80">
                          <Globe className="mr-1 h-3 w-3 text-muted-foreground" />
                          {rawIp}
                        </span>
                        <span className="h-3 w-px bg-border" />
                        <span>{formatRelativeTime(latest.last_active_at || latest.created_at)}</span>
                      </div>

                      {hasMultiple && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRevokingThisUser}
                          onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
                          className="h-7 rounded-md border-border/70 bg-transparent px-2.5 text-[12px] font-medium text-destructive hover:border-destructive/40 hover:bg-destructive/[0.04]"
                          title="Terminate all sessions for this user"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {isRevokingThisUser
                            ? "Terminating"
                            : `Terminate all (${group.allSessions.length})`}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[720px]">
                        <TableHeader>
                          <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                            <TableHead className="min-w-[160px] py-2.5 font-sans normal-case tracking-normal">Browser</TableHead>
                            <TableHead className="min-w-[140px] py-2.5 font-sans normal-case tracking-normal">IP address</TableHead>
                            <TableHead className="min-w-[120px] py-2.5 font-sans normal-case tracking-normal">Last active</TableHead>
                            <TableHead className="min-w-[140px] py-2.5 font-sans normal-case tracking-normal">Signed in</TableHead>
                            <TableHead className="min-w-[140px] py-2.5 font-sans normal-case tracking-normal">Expires</TableHead>
                            <TableHead className="min-w-[100px] py-2.5 text-right font-sans normal-case tracking-normal">Action</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {group.allSessions.map((session, sIdx) => {
                            const sRawUa = session.device || session.user_agent || "Client device";
                            const sRawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                            const sParsed = parseUserAgent(sRawUa);
                            const isSubRevoking = revokingId === session.id;
                            const isCurrent = Boolean(session.current ?? session.is_current ?? (sIdx === 0 && !hasMultiple));

                            return (
                              <TableRow key={session.id || sIdx} className="border-b border-border/60 text-sm hover:bg-muted/25">
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="shrink-0 rounded-md border border-border/70 bg-muted/40 p-1 text-muted-foreground">
                                      {sParsed.isMobile ? (
                                        <Smartphone className="h-3.5 w-3.5" />
                                      ) : (
                                        <Laptop className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help whitespace-nowrap text-[13px] font-medium text-foreground">
                                            {sParsed.browser}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs break-all font-mono text-[10px]">
                                          {sRawUa}
                                        </TooltipContent>
                                      </Tooltip>
                                      {isCurrent && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-background/60 px-1.5 py-0 text-[10px] text-foreground">
                                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                          Current
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="whitespace-nowrap py-2.5 font-mono text-[11px] text-foreground">
                                  <span className="flex items-center">
                                    <Globe className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" />
                                    {sRawIp}
                                  </span>
                                </TableCell>

                                <TableCell className="whitespace-nowrap py-2.5 font-mono text-[11px] text-muted-foreground">
                                  <span title={session.last_active_at || session.created_at || ""}>
                                    {formatRelativeTime(session.last_active_at || session.created_at)}
                                  </span>
                                </TableCell>

                                <TableCell className="whitespace-nowrap py-2.5 font-mono text-[11px] text-muted-foreground">
                                  {session.created_at ? formatDateTime(session.created_at) : "—"}
                                </TableCell>

                                <TableCell className="whitespace-nowrap py-2.5 font-mono text-[11px] text-muted-foreground">
                                  <span title={session.expires_at ? formatDateTime(session.expires_at) : "Active"}>
                                    {session.expires_at ? formatDateTime(session.expires_at) : "Active"}
                                  </span>
                                </TableCell>

                                <TableCell className="whitespace-nowrap py-2.5 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isSubRevoking}
                                    onClick={() => handleRevoke(session.id)}
                                    className="h-7 rounded-md border-border/70 bg-transparent px-2.5 text-[12px] font-medium text-destructive hover:border-destructive/40 hover:bg-destructive/[0.04]"
                                    title="Terminate this session"
                                  >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    {isSubRevoking ? "..." : "Terminate"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
