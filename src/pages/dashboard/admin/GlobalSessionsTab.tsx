import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Clock,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

interface UserSessionGroup {
  userId: string;
  email?: string;
  latestSession: SessionItem;
  restSessions: SessionItem[];
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

  // Group sessions by user_id
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
        const restSessions = sorted.slice(1);
        const email =
          userSessions.find((s) => s.email || s.user_email)?.email ||
          userSessions.find((s) => s.email || s.user_email)?.user_email ||
          userMap[userId];

        return {
          userId,
          email,
          latestSession,
          restSessions,
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
            (s.device || s.user_agent || "").toLowerCase().includes(q)
        )
    );
  }, [sessions, searchQuery, userMap]);

  const uniqueUserCount = useMemo(() => {
    return new Set(sessions.map((s) => s.user_id || s.email || s.user_email || "anonymous_user")).size;
  }, [sessions]);

  const usersWithMultipleSessions = useMemo(() => {
    return groupedSessions.filter((g) => g.restSessions.length > 0);
  }, [groupedSessions]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleAllExpand = () => {
    const anyExpanded = groupedSessions.some((g) => expandedUsers[g.userId]);
    if (anyExpanded) {
      setExpandedUsers({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groupedSessions) {
        if (g.restSessions.length > 0) {
          next[g.userId] = true;
        }
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
          {usersWithMultipleSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllExpand}
              className="h-8 px-2.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground"
            >
              {groupedSessions.some((g) => expandedUsers[g.userId]) ? "Collapse Secondary" : "Expand All Secondary"}
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
            placeholder="Search by User ID, email, IP, or device..."
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

      {/* Compact Master Sessions Table */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none">
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-transparent text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TableHead className="w-8 py-2.5 px-2 text-center"></TableHead>
                  <TableHead className="min-w-[190px] py-2.5">User Account</TableHead>
                  <TableHead className="min-w-[160px] py-2.5">Active Sessions (Drop Down)</TableHead>
                  <TableHead className="min-w-[210px] py-2.5">Primary Device</TableHead>
                  <TableHead className="min-w-[120px] py-2.5">Client IP</TableHead>
                  <TableHead className="min-w-[110px] py-2.5">Last Active</TableHead>
                  <TableHead className="min-w-[120px] py-2.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-xs">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        <span>Querying active sessions across enterprise directory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : groupedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <ShieldAlert className="h-5 w-5 text-muted-foreground mb-0.5" />
                        <span className="font-medium text-foreground">
                          {searchQuery ? "No sessions match filter criteria." : "No active sessions found across enterprise directory."}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Only active and valid sessions appear here.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedSessions.map((group) => {
                    const isExpanded = Boolean(expandedUsers[group.userId]);
                    const latest = group.latestSession;
                    const hasMultiple = group.restSessions.length > 0;
                    const isRevokingThisUser = revokingUser === group.userId;
                    const isLatestRevoking = revokingId === latest.id;

                    const rawUa = latest.device || latest.user_agent || "Corporate Workstation";
                    const rawIp = (latest.ip || latest.ip_address || "—").replace(/\/32$/, "");
                    const parsed = parseUserAgent(rawUa);
                    const emailDisplay = group.email || userMap[group.userId] || null;

                    return (
                      <React.Fragment key={group.userId}>
                        {/* Compact Master User Row */}
                        <TableRow className={`border-b border-border/60 hover:bg-muted/20 transition-colors ${isExpanded ? "bg-muted/15" : ""}`}>
                          {/* Chevron: Inline Dropdown Toggle */}
                          <TableCell className="w-8 py-2 px-2 text-center">
                            {hasMultiple ? (
                              <button
                                type="button"
                                onClick={() => toggleUserExpand(group.userId)}
                                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                                title={isExpanded ? "Collapse secondary sessions" : `Drop down ${group.restSessions.length} more sessions inline`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : null}
                          </TableCell>

                          {/* User Account Column */}
                          <TableCell className="py-2">
                            <div className="flex flex-col space-y-0.5">
                              <span
                                className="font-semibold text-xs text-foreground font-mono truncate max-w-[180px]"
                                title={emailDisplay || group.userId}
                              >
                                {emailDisplay || group.userId}
                              </span>
                              <div className="flex items-center space-x-1 text-[10px] font-mono text-muted-foreground">
                                <span className="text-[9px] uppercase font-semibold text-muted-foreground/70">ID:</span>
                                <span className="truncate max-w-[120px]">{group.userId}</span>
                                <CopyButton value={group.userId} className="h-3.5 px-1 text-[8px] rounded" />
                              </div>
                            </div>
                          </TableCell>

                          {/* Active Sessions Dropdown Menu Column */}
                          <TableCell className="py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 px-2.5 text-xs font-mono rounded-lg transition-all flex items-center space-x-1.5 ${
                                    hasMultiple
                                      ? "border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                                      : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      hasMultiple ? "bg-primary animate-pulse" : "bg-emerald-500"
                                    }`}
                                  />
                                  <span>
                                    {group.allSessions.length}{" "}
                                    {group.allSessions.length === 1 ? "Session" : "Sessions"}
                                  </span>
                                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                                </Button>
                              </DropdownMenuTrigger>

                              {/* Drop Down Menu with Complete Unreduced Details */}
                              <DropdownMenuContent
                                align="start"
                                className="w-[430px] p-3 text-xs rounded-xl border border-border/80 shadow-2xl bg-card max-h-[85vh] overflow-y-auto"
                              >
                                <DropdownMenuLabel className="p-0 pb-2.5 mb-2 border-b border-border/70 flex items-center justify-between">
                                  <div className="flex flex-col space-y-0.5 min-w-0 flex-1 pr-2">
                                    <div className="flex items-center space-x-1.5">
                                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="font-semibold text-xs text-foreground truncate">
                                        {emailDisplay || group.userId}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                                      User ID: {group.userId}
                                    </span>
                                  </div>

                                  {hasMultiple && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={isRevokingThisUser}
                                      onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
                                      className="h-6 px-2 text-[10px] rounded font-medium shrink-0"
                                      title="Terminate all active sessions for this user"
                                    >
                                      <Trash2 className="h-2.5 w-2.5 mr-1" />
                                      <span>{isRevokingThisUser ? "Terminating..." : `Terminate All (${group.allSessions.length})`}</span>
                                    </Button>
                                  )}
                                </DropdownMenuLabel>

                                {/* List of Full Detailed Sessions Inside Drop Down */}
                                <div className="space-y-2.5 divide-y divide-border/50">
                                  {group.allSessions.map((session, sIdx) => {
                                    const sRawUa = session.device || session.user_agent || "Client Device";
                                    const sRawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                                    const sParsed = parseUserAgent(sRawUa);
                                    const isSubRevoking = revokingId === session.id;
                                    const isCurrent = Boolean(session.current ?? session.is_current ?? (sIdx === 0 && !hasMultiple));

                                    return (
                                      <div key={session.id || sIdx} className="pt-2.5 first:pt-0 space-y-2">
                                        {/* Device & Status Row */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 min-w-0">
                                            <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                              {sParsed.isMobile ? (
                                                <Smartphone className="h-3.5 w-3.5" />
                                              ) : (
                                                <Laptop className="h-3.5 w-3.5" />
                                              )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                              <div className="flex items-center space-x-1.5">
                                                <span className="font-semibold text-xs text-foreground truncate">
                                                  {sParsed.device}
                                                </span>
                                                {isCurrent && (
                                                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                                    Current
                                                  </Badge>
                                                )}
                                              </div>
                                              <span className="text-[10px] font-mono text-muted-foreground truncate">
                                                ID: {session.id}
                                              </span>
                                            </div>
                                          </div>

                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={isSubRevoking}
                                            onClick={() => handleRevoke(session.id)}
                                            className="h-6 px-2 text-[10px] font-mono rounded shrink-0"
                                            title="Terminate this session"
                                          >
                                            <Trash2 className="h-2.5 w-2.5 mr-1" />
                                            <span>{isSubRevoking ? "..." : "Terminate"}</span>
                                          </Button>
                                        </div>

                                        {/* Raw User Agent Box with Copy Button */}
                                        <div className="p-1.5 rounded-md bg-muted/40 border border-border/70 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                          <span className="truncate pr-2 select-all" title={sRawUa}>
                                            {sRawUa}
                                          </span>
                                          <CopyButton value={sRawUa} className="h-4 px-1 text-[8px] rounded shrink-0" />
                                        </div>

                                        {/* IP, Last Active & Expiration Telemetry */}
                                        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-muted-foreground">
                                          <div className="flex items-center space-x-1">
                                            <Globe className="h-3 w-3 text-primary opacity-70 shrink-0" />
                                            <span className="text-foreground">{sRawIp}</span>
                                          </div>
                                          <div className="flex items-center space-x-1 justify-end">
                                            <Clock className="h-3 w-3 text-primary opacity-70 shrink-0" />
                                            <span title={session.last_active_at || session.created_at || ""}>
                                              {formatRelativeTime(session.last_active_at || session.created_at)}
                                            </span>
                                          </div>
                                          {session.created_at && (
                                            <div className="flex items-center space-x-1 col-span-2 text-[10px]">
                                              <Calendar className="h-3 w-3 text-muted-foreground opacity-60 shrink-0" />
                                              <span>Signed In: {formatDateTime(session.created_at)}</span>
                                            </div>
                                          )}
                                          {session.expires_at && (
                                            <div className="flex items-center space-x-1 col-span-2 text-[10px]">
                                              <span className="text-muted-foreground opacity-70 font-semibold">Expires:</span>
                                              <span>{formatDateTime(session.expires_at)}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>

                          {/* Primary Device Column */}
                          <TableCell className="py-2">
                            <div className="flex items-center space-x-2">
                              <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {parsed.isMobile ? (
                                  <Smartphone className="h-3.5 w-3.5" />
                                ) : (
                                  <Laptop className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-xs text-foreground font-medium truncate max-w-[160px]" title={parsed.device}>
                                    {parsed.device}
                                  </span>
                                  {(latest.is_current || latest.current) && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px] cursor-help block">
                                      {rawUa}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs break-all font-mono text-[10px]">
                                    {rawUa}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </TableCell>

                          {/* Client IP Column */}
                          <TableCell className="py-2 font-mono text-xs text-foreground whitespace-nowrap">
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1 text-primary opacity-80 shrink-0" />
                              {rawIp}
                            </span>
                          </TableCell>

                          {/* Last Active Column */}
                          <TableCell className="py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            <span title={latest.last_active_at || latest.created_at || ""}>
                              {formatRelativeTime(latest.last_active_at || latest.created_at)}
                            </span>
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isLatestRevoking}
                                onClick={() => handleRevoke(latest.id)}
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg font-medium"
                                title="Terminate primary session"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span>{isLatestRevoking ? "..." : "Terminate"}</span>
                              </Button>

                              {hasMultiple && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isRevokingThisUser}
                                  onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
                                  className="h-7 px-2 text-[10px] font-medium rounded-lg"
                                  title={`Terminate all ${group.allSessions.length} sessions for this user`}
                                >
                                  <span>{isRevokingThisUser ? "..." : `All (${group.allSessions.length})`}</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Inline Dropdown Section for Secondary Sessions */}
                        {hasMultiple && isExpanded && group.restSessions.map((sub, sIdx) => {
                          const subRawUa = sub.device || sub.user_agent || "Secondary Client";
                          const subRawIp = (sub.ip || sub.ip_address || "—").replace(/\/32$/, "");
                          const subParsed = parseUserAgent(subRawUa);
                          const isSubRevoking = revokingId === sub.id;

                          return (
                            <TableRow key={sub.id || sIdx} className="bg-muted/10 border-b border-border/40 hover:bg-muted/20 text-xs">
                              <TableCell className="py-1.5 px-2 text-center text-muted-foreground/60 font-mono text-[11px]">
                                ↳
                              </TableCell>
                              <TableCell className="py-1.5 font-mono text-[11px] text-muted-foreground/80 italic pl-3">
                                Secondary Session
                              </TableCell>
                              <TableCell className="py-1.5 text-muted-foreground text-[11px] font-mono">
                                ID: {sub.id.slice(0, 8)}...
                              </TableCell>
                              <TableCell className="py-1.5">
                                <div className="flex items-center space-x-2">
                                  <div className="p-0.5 rounded bg-muted/40 text-muted-foreground shrink-0">
                                    {subParsed.isMobile ? (
                                      <Smartphone className="h-3 w-3" />
                                    ) : (
                                      <Laptop className="h-3 w-3" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-foreground/85 font-medium truncate max-w-[160px]" title={subParsed.device}>
                                      {subParsed.device}
                                    </span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px] cursor-help block">
                                          {subRawUa}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs break-all font-mono text-[10px]">
                                        {subRawUa}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-1.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                <span className="flex items-center">
                                  <Globe className="h-2.5 w-2.5 mr-1 text-primary opacity-60 shrink-0" />
                                  {subRawIp}
                                </span>
                              </TableCell>
                              <TableCell className="py-1.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {formatRelativeTime(sub.last_active_at || sub.created_at)}
                              </TableCell>
                              <TableCell className="py-1.5 text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isSubRevoking}
                                  onClick={() => handleRevoke(sub.id)}
                                  className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive rounded"
                                  title="Terminate this session"
                                >
                                  <Trash2 className="h-2.5 w-2.5 mr-1" />
                                  <span>{isSubRevoking ? "..." : "Terminate"}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
