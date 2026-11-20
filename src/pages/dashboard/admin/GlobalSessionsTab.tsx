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
} from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

export function GlobalSessionsTab() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [collapsedUsers, setCollapsedUsers] = useState<Record<string, boolean>>({});
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

  const handleRevokeAllForUser = async (userEmail: string, userSessions: SessionItem[]) => {
    setRevokingUser(userEmail);
    setMessage(null);
    setError(null);
    try {
      for (const s of userSessions) {
        await api.revokeSession(s.id);
      }
      setMessage(`Terminated all ${userSessions.length} session(s) belonging to ${userEmail}.`);
      setSessions((prev) =>
        prev.filter((s) => (s.email || s.user_email || s.user_id || "corporate_user") !== userEmail)
      );
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate all sessions for user.");
    } finally {
      setRevokingUser(null);
    }
  };

  // Group sessions by user account
  const groupedSessions = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const email = session.email || session.user_email || session.user_id || "corporate_user";
      const existing = map.get(email) || [];
      existing.push(session);
      map.set(email, existing);
    }

    const groups = Array.from(map.entries()).map(([email, userSessions]) => ({
      email,
      sessions: userSessions,
    }));

    if (!searchQuery.trim()) return groups;

    const q = searchQuery.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.email.toLowerCase().includes(q) ||
        g.sessions.some(
          (s) =>
            (s.ip || s.ip_address || "").toLowerCase().includes(q) ||
            (s.device || s.user_agent || "").toLowerCase().includes(q)
        )
    );
  }, [sessions, searchQuery]);

  const uniqueUserCount = useMemo(() => {
    return new Set(sessions.map((s) => s.email || s.user_email || s.user_id || "corporate_user")).size;
  }, [sessions]);

  const toggleUserCollapse = (email: string) => {
    setCollapsedUsers((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const toggleAllCollapse = () => {
    const allCollapsed = groupedSessions.every((g) => collapsedUsers[g.email]);
    if (allCollapsed) {
      setCollapsedUsers({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groupedSessions) {
        next[g.email] = true;
      }
      setCollapsedUsers(next);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              User-Grouped Active Sessions
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized multi-device session directory categorized user-wise with instant 1-click termination.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {groupedSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllCollapse}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              {groupedSessions.every((g) => collapsedUsers[g.email]) ? "Expand All" : "Collapse All"}
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
            placeholder="Search by user email, IP address, or workstation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-card"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono text-xs border-primary/30 text-foreground bg-primary/5">
            {uniqueUserCount} Authenticated {uniqueUserCount === 1 ? "User" : "Users"}
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
            <span className="font-mono">Categorizing active sessions user-wise across directory...</span>
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
              const isRevokingThisUser = revokingUser === group.email;
              const isCollapsed = Boolean(collapsedUsers[group.email]);

              return (
                <Card key={group.email} className="border-border shadow-sm overflow-hidden">
                  {/* User Group Card Header */}
                  <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div
                        onClick={() => toggleUserCollapse(group.email)}
                        className="flex items-center space-x-3 cursor-pointer group select-none flex-1 min-w-0"
                      >
                        <div className="p-2 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0 transition-transform group-hover:scale-105">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {group.email}
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] py-0 px-1.5 border-primary/40 bg-primary/5 text-primary shrink-0"
                            >
                              {group.sessions.length} {group.sessions.length === 1 ? "Active Session" : "Active Sessions"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {group.sessions.length === 1
                              ? "1 authenticated client device"
                              : `${group.sessions.length} concurrent client devices`}
                          </span>
                        </div>
                        <div className="text-muted-foreground group-hover:text-foreground pl-1">
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Bulk Revoke Action */}
                      <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                        {group.sessions.length > 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isRevokingThisUser}
                            onClick={() => handleRevokeAllForUser(group.email, group.sessions)}
                            className="h-7 px-2.5 text-xs font-mono"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span>
                              {isRevokingThisUser
                                ? "Revoking All..."
                                : `Terminate All (${group.sessions.length})`}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Sessions Table for this user */}
                  {!isCollapsed && (
                    <CardContent className="p-0 overflow-x-auto">
                      <Table className="min-w-[720px]">
                        <TableHeader>
                          <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="min-w-[280px] text-[11px] uppercase tracking-wider font-mono">
                              Client & Device
                            </TableHead>
                            <TableHead className="min-w-[140px] text-[11px] uppercase tracking-wider font-mono">
                              IP Address
                            </TableHead>
                            <TableHead className="min-w-[120px] text-[11px] uppercase tracking-wider font-mono">
                              Last Active
                            </TableHead>
                            <TableHead className="min-w-[140px] text-[11px] uppercase tracking-wider font-mono">
                              Idle Expiration
                            </TableHead>
                            <TableHead className="min-w-[100px] text-right text-[11px] uppercase tracking-wider font-mono">
                              Kill-Switch
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {group.sessions.map((session, sIdx) => {
                            const rawUa = session.device || session.user_agent || "Corporate Workstation";
                            const rawIp = session.ip || session.ip_address || "—";
                            const parsed = parseUserAgent(rawUa);
                            const isCurrentRevoking = revokingId === session.id;

                            return (
                              <TableRow key={session.id || sIdx} className="border-border hover:bg-muted/30">
                                <TableCell>
                                  <div className="flex items-center space-x-2.5 py-0.5">
                                    <div className="p-1.5 rounded bg-muted/40 text-muted-foreground border border-border shrink-0">
                                      {parsed.isMobile ? (
                                        <Smartphone className="h-3.5 w-3.5" />
                                      ) : (
                                        <Laptop className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs text-foreground font-medium whitespace-nowrap">
                                        {parsed.device}
                                      </span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[260px] cursor-help block">
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

                                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                  <span className="flex items-center">
                                    <Globe className="h-3 w-3 mr-1 opacity-70 shrink-0" />
                                    {rawIp}
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
                                    disabled={isCurrentRevoking}
                                    onClick={() => handleRevoke(session.id)}
                                    className="h-7 px-2.5 text-xs font-mono"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    <span>{isCurrentRevoking ? "Terminating..." : "Terminate"}</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
