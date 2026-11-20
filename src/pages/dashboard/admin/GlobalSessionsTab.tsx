import { useState, useEffect, useMemo } from "react";
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
  ChevronUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGlobalSessions(100);
      setSessions(data || []);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load global active sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    setMessage(null);
    setError(null);
    try {
      await api.revokeSession(sessionId);
      setMessage("Global session terminated. Bearer token expunged immediately from directory.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate session.");
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
      setMessage(`Terminated all ${userSessions.length} session(s) for User ID ${userId}.`);
      setSessions((prev) =>
        prev.filter((s) => (s.user_id || s.email || s.user_email || "anonymous_user") !== userId)
      );
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate all sessions for user.");
    } finally {
      setRevokingUser(null);
    }
  };

  // Group sessions strictly by user_id, keeping latest/current as displayable one
  const groupedSessions = useMemo<UserSessionGroup[]>(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      // Group by user_id primarily
      const userId = session.user_id || session.email || session.user_email || "anonymous_user";
      const existing = map.get(userId) || [];
      existing.push(session);
      map.set(userId, existing);
    }

    const groups: UserSessionGroup[] = Array.from(map.entries())
      .filter(([_, userSessions]) => userSessions.length > 0)
      .map(([userId, userSessions]) => {
        // Sort chronologically descending, prioritizing is_current
        const sorted = [...userSessions].sort((a, b) => {
          if (a.is_current || a.current) return -1;
          if (b.is_current || b.current) return 1;
          return getSessionTimestamp(b) - getSessionTimestamp(a);
        });

        const latestSession = sorted[0]!;
        const restSessions = sorted.slice(1);
        const email =
          userSessions.find((s) => s.email || s.user_email)?.email ||
          userSessions.find((s) => s.email || s.user_email)?.user_email;

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
  }, [sessions, searchQuery]);

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

  const usersWithMultipleSessions = useMemo(() => {
    return groupedSessions.filter((g) => g.restSessions.length > 0);
  }, [groupedSessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              User ID Grouped Active Sessions
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sessions grouped strictly by User ID. Displays primary/current session with expandable view for secondary sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {usersWithMultipleSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllExpand}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              {groupedSessions.some((g) => expandedUsers[g.userId]) ? "Collapse All Extra Sessions" : "Expand All Extra Sessions"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchGlobalSessions}
            disabled={loading}
            className="h-8 text-xs font-mono"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by User ID, email, IP address, or device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-card"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-xs border-primary/30 text-foreground bg-primary/5">
            {uniqueUserCount} Unique {uniqueUserCount === 1 ? "User ID" : "User IDs"}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            {sessions.length} Live {sessions.length === 1 ? "Session" : "Sessions"}
          </Badge>
        </div>
      </div>

      {/* Grouped User Sessions */}
      {loading ? (
        <Card className="border-border">
          <CardContent className="h-36 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="font-mono">Grouping active sessions by User ID across directory...</span>
          </CardContent>
        </Card>
      ) : groupedSessions.length === 0 ? (
        <Card className="border-border">
          <CardContent className="h-32 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-1">
            <ShieldAlert className="h-5 w-5 text-muted-foreground mb-1" />
            <span>{searchQuery ? "No sessions matching your filter criteria." : "No active sessions detected across system."}</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <TooltipProvider>
            {groupedSessions.map((group) => {
              const isRevokingThisUser = revokingUser === group.userId;
              const isExpanded = Boolean(expandedUsers[group.userId]);
              const latest = group.latestSession;
              const hasMultiple = group.restSessions.length > 0;

              // Telemetry for latest session
              const rawUa = latest.device || latest.user_agent || "Corporate Workstation";
              const rawIp = latest.ip || latest.ip_address || "—";
              const parsed = parseUserAgent(rawUa);
              const isLatestRevoking = revokingId === latest.id;

              return (
                <Card key={group.userId} className="border-border shadow-sm overflow-hidden bg-card">
                  {/* User Primary Header */}
                  <CardHeader className="py-2.5 px-4 bg-muted/25 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-2 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">
                          <User className="h-4 w-4" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                              User ID:
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground truncate">
                              {group.userId}
                            </span>
                            <CopyButton value={group.userId} className="h-5 px-1 text-[10px]" />
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] py-0 px-1.5 shrink-0 ${
                                hasMultiple
                                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {group.allSessions.length} {group.allSessions.length === 1 ? "Session" : "Sessions"}
                            </Badge>
                          </div>

                          {group.email && (
                            <span className="text-[11px] font-mono text-muted-foreground truncate">
                              Account: <span className="text-foreground">{group.email}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bulk Kill-Switch for this User */}
                      {hasMultiple && (
                        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isRevokingThisUser}
                            onClick={() => handleRevokeAllForUser(group.userId, group.allSessions)}
                            className="h-7 px-2.5 text-xs font-mono"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span>
                              {isRevokingThisUser
                                ? "Terminating All..."
                                : `Terminate All (${group.allSessions.length})`}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  {/* Main Displayable Session (Latest / Current) */}
                  <CardContent className="p-0">
                    <div className="px-4 py-3 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-foreground flex items-center">
                            <Sparkles className="h-3 w-3 text-primary mr-1" />
                            Latest / Current Session
                          </span>
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                            {latest.is_current || latest.current ? "Active Device" : "Latest Active"}
                          </span>
                        </div>
                      </div>

                      {/* Primary Session Table View */}
                      <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow className="border-b border-border/60 hover:bg-transparent">
                              <TableHead className="min-w-[260px] text-[10px] uppercase tracking-wider font-mono">
                                Client Device
                              </TableHead>
                              <TableHead className="min-w-[130px] text-[10px] uppercase tracking-wider font-mono">
                                IP Address
                              </TableHead>
                              <TableHead className="min-w-[120px] text-[10px] uppercase tracking-wider font-mono">
                                Last Active
                              </TableHead>
                              <TableHead className="min-w-[130px] text-[10px] uppercase tracking-wider font-mono">
                                Expiration
                              </TableHead>
                              <TableHead className="min-w-[100px] text-right text-[10px] uppercase tracking-wider font-mono">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="border-0 hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center space-x-2.5 py-0.5">
                                  <div className="p-1.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                    {parsed.isMobile ? (
                                      <Smartphone className="h-3.5 w-3.5" />
                                    ) : (
                                      <Laptop className="h-3.5 w-3.5" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-foreground font-semibold whitespace-nowrap">
                                      {parsed.device}
                                    </span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[250px] cursor-help block">
                                          {rawUa}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs break-all font-mono text-[11px]">
                                        {rawUa}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="font-mono text-xs text-foreground whitespace-nowrap">
                                <span className="flex items-center">
                                  <Globe className="h-3 w-3 mr-1 text-primary opacity-80 shrink-0" />
                                  {rawIp}
                                </span>
                              </TableCell>

                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {formatRelativeTime(latest.last_active_at || latest.created_at)}
                              </TableCell>

                              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {latest.expires_at ? formatDateTime(latest.expires_at) : "Dynamic (30m)"}
                              </TableCell>

                              <TableCell className="text-right whitespace-nowrap">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLatestRevoking}
                                  onClick={() => handleRevoke(latest.id)}
                                  className="h-7 px-2.5 text-xs font-mono"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  <span>{isLatestRevoking ? "Terminating..." : "Terminate"}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {/* "More Sessions" Button for this User ID */}
                      {hasMultiple && (
                        <div className="mt-3 pt-2.5 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserExpand(group.userId)}
                            className="h-7 px-3 text-xs font-mono border-primary/40 text-primary hover:bg-primary/10 hover:text-primary flex items-center space-x-1.5 self-start"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                <span>Hide older sessions ({group.restSessions.length})</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                <span>
                                  +{group.restSessions.length} more {group.restSessions.length === 1 ? "session" : "sessions"} on this user ID
                                </span>
                              </>
                            )}
                          </Button>

                          <span className="text-[11px] text-muted-foreground font-mono">
                            {isExpanded
                              ? `Expanded ${group.restSessions.length} secondary session(s)`
                              : `User ID has ${group.restSessions.length} additional background/device session(s)`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Section: Rest of the Sessions */}
                    {hasMultiple && isExpanded && (
                      <div className="border-t border-border bg-muted/20 px-4 py-3">
                        <div className="flex items-center space-x-1.5 mb-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <span>Secondary / Older Active Sessions for User ID ({group.restSessions.length})</span>
                        </div>

                        <div className="overflow-x-auto rounded border border-border bg-card">
                          <Table className="min-w-[680px]">
                            <TableHeader>
                              <TableRow className="border-b border-border hover:bg-transparent">
                                <TableHead className="min-w-[240px] text-[10px] uppercase tracking-wider font-mono">
                                  Secondary Device
                                </TableHead>
                                <TableHead className="min-w-[130px] text-[10px] uppercase tracking-wider font-mono">
                                  IP Address
                                </TableHead>
                                <TableHead className="min-w-[120px] text-[10px] uppercase tracking-wider font-mono">
                                  Last Active
                                </TableHead>
                                <TableHead className="min-w-[130px] text-[10px] uppercase tracking-wider font-mono">
                                  Expiration
                                </TableHead>
                                <TableHead className="min-w-[90px] text-right text-[10px] uppercase tracking-wider font-mono">
                                  Kill-Switch
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.restSessions.map((session, rIdx) => {
                                const subRawUa = session.device || session.user_agent || "Secondary Client";
                                const subRawIp = session.ip || session.ip_address || "—";
                                const subParsed = parseUserAgent(subRawUa);
                                const isSubRevoking = revokingId === session.id;

                                return (
                                  <TableRow key={session.id || rIdx} className="border-border hover:bg-muted/30">
                                    <TableCell>
                                      <div className="flex items-center space-x-2 py-0.5">
                                        <div className="p-1 rounded bg-muted/40 text-muted-foreground border border-border shrink-0">
                                          {subParsed.isMobile ? (
                                            <Smartphone className="h-3 w-3" />
                                          ) : (
                                            <Laptop className="h-3 w-3" />
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs text-foreground font-medium whitespace-nowrap">
                                            {subParsed.device}
                                          </span>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[220px] cursor-help block">
                                                {subRawUa}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs break-all font-mono text-[11px]">
                                              {subRawUa}
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </TableCell>

                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                      <span className="flex items-center">
                                        <Globe className="h-3 w-3 mr-1 opacity-70 shrink-0" />
                                        {subRawIp}
                                      </span>
                                    </TableCell>

                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                      {formatRelativeTime(session.last_active_at || session.created_at)}
                                    </TableCell>

                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                      {session.expires_at ? formatDateTime(session.expires_at) : "Dynamic (30m)"}
                                    </TableCell>

                                    <TableCell className="text-right whitespace-nowrap">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isSubRevoking}
                                        onClick={() => handleRevoke(session.id)}
                                        className="h-6 px-2 text-[11px] font-mono"
                                      >
                                        <Trash2 className="h-2.5 w-2.5 mr-1" />
                                        <span>{isSubRevoking ? "..." : "Terminate"}</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
