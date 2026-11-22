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
import { Badge } from "@/components/ui/badge";
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
      const [data] = await Promise.all([
        api.getGlobalSessions(100),
        fetchUsers(),
      ]);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Global Active Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Directory-wide live authentication grants, client footprints, and instant remote revocation.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {groupedSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllExpand}
              className="h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground"
            >
              {groupedSessions.every((g) => expandedUsers[g.userId])
                ? "Collapse All"
                : "Expand All"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchGlobalSessions}
            disabled={loading}
            className="h-8 px-3 text-xs font-medium rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filter & Counter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by User ID, email, IP, or browser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 rounded-lg bg-background/50 focus:bg-background text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 rounded-md border-primary/30 text-foreground bg-primary/5">
            {uniqueUserCount} {uniqueUserCount === 1 ? "User" : "Users"}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs px-2.5 py-0.5 rounded-md">
            {sessions.length} Live {sessions.length === 1 ? "Session" : "Sessions"}
          </Badge>
        </div>
      </div>

      {/* User Sessions Dropdown Cards */}
      {loading ? (
        <div className="rounded-xl border border-border/80 bg-card p-10 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">Querying active sessions across enterprise directory...</span>
        </div>
      ) : groupedSessions.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-10 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-1.5 text-center">
          <ShieldAlert className="h-6 w-6 text-muted-foreground mb-0.5" />
          <span className="font-medium text-foreground">
            {searchQuery ? "No sessions match filter criteria." : "No active sessions found across enterprise directory."}
          </span>
          <span className="text-[11px] text-muted-foreground">Only active and valid sessions appear here.</span>
        </div>
      ) : (
        <TooltipProvider>
          <div className="space-y-2.5">
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
                  className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-all"
                >
                  {/* Big User Header: Click to Drop Down Sessions Table */}
                  <div
                    onClick={() => toggleUserExpand(group.userId)}
                    className="py-2.5 px-3.5 sm:px-4 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/80 flex items-center justify-between gap-3 select-none"
                  >
                    {/* Left: Chevron + User Avatar + Email + User ID */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className="text-xs font-semibold text-foreground font-mono truncate"
                            title={emailDisplay || group.userId}
                          >
                            {emailDisplay || group.userId}
                          </span>
                          <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
                            <CopyButton
                              value={group.userId}
                              className="h-4 px-1 text-[9px] rounded"
                            />
                          </span>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] py-0 px-2 rounded-md shrink-0 ${
                              hasMultiple
                                ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {group.allSessions.length} {group.allSessions.length === 1 ? "Session" : "Sessions"}
                          </Badge>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground truncate">
                          ID: {group.userId}
                        </span>
                      </div>
                    </div>

                    {/* Right: Summary Telemetry + Terminate All */}
                    <div
                      className="flex items-center space-x-3 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Compact Telemetry Summary on Header */}
                      <div className="hidden md:flex items-center space-x-3 text-[11px] font-mono text-muted-foreground pr-2">
                        <span className="flex items-center text-foreground/80">
                          <Globe className="h-3 w-3 mr-1 text-primary opacity-70" />
                          {rawIp}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(latest.last_active_at || latest.created_at)}</span>
                      </div>

                      {/* Terminate All Button */}
                      {hasMultiple && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isRevokingThisUser}
                          onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
                          className="h-7 px-2.5 text-xs rounded-lg font-medium"
                          title="Terminate all active sessions for this user"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          <span>
                            {isRevokingThisUser
                              ? "Terminating..."
                              : `Terminate All (${group.allSessions.length})`}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Big Drop Down Content: Full Detailed Sessions Table for this User */}
                  {isExpanded && (
                    <div className="p-0 overflow-x-auto">
                      <Table className="min-w-[720px]">
                        <TableHeader>
                          <TableRow className="border-b border-border/80 bg-muted/10 hover:bg-transparent text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <TableHead className="min-w-[160px] py-2.5">Browser</TableHead>
                            <TableHead className="min-w-[140px] py-2.5">IP Address</TableHead>
                            <TableHead className="min-w-[120px] py-2.5">Last Active</TableHead>
                            <TableHead className="min-w-[140px] py-2.5">Signed In</TableHead>
                            <TableHead className="min-w-[140px] py-2.5">Expires</TableHead>
                            <TableHead className="min-w-[100px] py-2.5 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {group.allSessions.map((session, sIdx) => {
                            const sRawUa = session.device || session.user_agent || "Client Device";
                            const sRawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                            const sParsed = parseUserAgent(sRawUa);
                            const isSubRevoking = revokingId === session.id;
                            const isCurrent = Boolean(session.current ?? session.is_current ?? (sIdx === 0 && !hasMultiple));

                            return (
                              <TableRow
                                key={session.id || sIdx}
                                className="border-b border-border/60 hover:bg-muted/20 text-xs transition-colors"
                              >
                                {/* Browser */}
                                <TableCell className="py-2.5">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                      {sParsed.isMobile ? (
                                        <Smartphone className="h-3.5 w-3.5" />
                                      ) : (
                                        <Laptop className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="font-semibold text-xs text-foreground cursor-help whitespace-nowrap">
                                            {sParsed.browser}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs break-all font-mono text-[10px]">
                                          {sRawUa}
                                        </TooltipContent>
                                      </Tooltip>
                                      {isCurrent && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0"
                                        >
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* IP Address */}
                                <TableCell className="py-2.5 font-mono text-xs text-foreground whitespace-nowrap">
                                  <span className="flex items-center">
                                    <Globe className="h-3 w-3 mr-1 text-primary opacity-80 shrink-0" />
                                    {sRawIp}
                                  </span>
                                </TableCell>

                                {/* Last Active */}
                                <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  <span title={session.last_active_at || session.created_at || ""}>
                                    {formatRelativeTime(session.last_active_at || session.created_at)}
                                  </span>
                                </TableCell>

                                {/* Signed In */}
                                <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  {session.created_at ? formatDateTime(session.created_at) : "—"}
                                </TableCell>

                                {/* Expiration */}
                                <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  <span title={session.expires_at ? formatDateTime(session.expires_at) : "Active"}>
                                    {session.expires_at ? formatDateTime(session.expires_at) : "Active"}
                                  </span>
                                </TableCell>

                                {/* Action */}
                                <TableCell className="py-2.5 text-right whitespace-nowrap">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isSubRevoking}
                                    onClick={() => handleRevoke(session.id)}
                                    className="h-7 px-2.5 text-xs rounded-lg font-medium"
                                    title="Terminate this session"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    <span>{isSubRevoking ? "..." : "Terminate"}</span>
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
