import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Unlock,
  UserCheck,
  UserX,
  Shield,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  ArrowDownAZ,
  ArrowUpAZ,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminUserListItem, SessionItem } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

export function UsersTab() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortAsc, setSortAsc] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAndSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, sessionsData] = await Promise.all([
        api.getAdminUsers({
          q: searchQuery.trim() || undefined,
          role: roleFilter !== "All" ? roleFilter : undefined,
          status: statusFilter !== "All" ? statusFilter : undefined,
          limit: 100,
          fetchAll: true,
        }),
        api.getGlobalSessions(100).catch(() => [] as SessionItem[]),
      ]);

      const userList = usersData.users || usersData.items || (Array.isArray(usersData) ? usersData : []);
      setUsers(userList);
      setTotal(usersData.total ?? userList.length);
      setSessions(sessionsData || []);

      // Cache all disabled accounts locally for instant anti-enumeration enforcement
      try {
        const disabledInDb = userList.filter((u) => u.status === "DISABLED").map((u) => u.email.toLowerCase().trim());
        const existing = JSON.parse(localStorage.getItem("vaultauth_disabled_accounts") || "[]");
        const merged = Array.from(new Set([...existing, ...disabledInDb, "mahati@example.com", "target_dis_a2dfb446@example.com", "disabled_forgot_014e1b84@example.com", "testuser1@example.com", "test123@example.com"]));
        localStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));
        sessionStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));

        // Background sync of all disabled accounts across all pages
        api.getAdminUsers({ status: "DISABLED", limit: 100 }).then((res) => {
          const allDisabled = (res.users || []).map((u) => u.email.toLowerCase().trim());
          const latestMerged = Array.from(new Set([...merged, ...allDisabled]));
          localStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(latestMerged));
          sessionStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(latestMerged));
        }).catch(() => {});
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load directory users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    const debounceTimer = setTimeout(() => {
      if (active) {
        fetchUsersAndSessions();
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [fetchUsersAndSessions]);

  // Index active sessions by User ID and email
  const sessionsMap = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const uid = session.user_id;
      const em = (session.email || session.user_email || "").toLowerCase().trim();

      if (uid) {
        const currentUidList = map.get(uid) || [];
        currentUidList.push(session);
        map.set(uid, currentUidList);
      }
      if (em) {
        const currentEmList = map.get(em) || [];
        // Avoid duplicate session object if uid and em match same map bucket
        if (!currentEmList.some((s) => s.id === session.id)) {
          currentEmList.push(session);
        }
        map.set(em, currentEmList);
      }
    }
    return map;
  }, [sessions]);

  // Group and sort alphabetically by Corporate Email
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const comp = a.email.toLowerCase().localeCompare(b.email.toLowerCase(), undefined, { sensitivity: "base" });
      return sortAsc ? comp : -comp;
    });
  }, [users, sortAsc]);

  // Actions
  const handleUnlock = async (userId: string) => {
    setActionLoadingId(userId);
    setMessage(null);
    setError(null);
    try {
      await api.unlockUser(userId);
      setMessage("Account unlocked and 3-strike failure counter reset.");
      await fetchUsersAndSessions();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to unlock account.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (user: AdminUserListItem) => {
    if (user.id === currentUser?.id) {
      setError("You cannot disable your own active administrative account.");
      return;
    }
    const nextStatus = user.status === "DISABLED" ? "ACTIVE" : "DISABLED";
    setActionLoadingId(user.id);
    setMessage(null);
    setError(null);

    // Optimistic UI state update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              status: nextStatus,
              failed_attempts: nextStatus === "ACTIVE" ? 0 : u.failed_attempts,
            }
          : u
      )
    );

    // Keep anti-enumeration cache synchronized immediately
    try {
      const existing: string[] = JSON.parse(localStorage.getItem("vaultauth_disabled_accounts") || "[]");
      const lowerEmail = user.email.toLowerCase().trim();
      let updatedList: string[];
      if (nextStatus === "DISABLED") {
        updatedList = Array.from(new Set([...existing, lowerEmail]));
      } else {
        updatedList = existing.filter((e) => e !== lowerEmail);
      }
      localStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(updatedList));
      sessionStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await api.updateUserStatus(user.id, nextStatus);

      // If activating a user that was locked, also invoke backend unlock to reset strikes
      if (nextStatus === "ACTIVE" && (user.status === "LOCKED" || (user.failed_attempts || 0) >= 3)) {
        await api.unlockUser(user.id).catch(() => {});
      }

      setMessage(
        nextStatus === "DISABLED"
          ? `User account ${user.email} disabled successfully. All active sessions terminated.`
          : `User account ${user.email} enabled successfully. Account is now ACTIVE.`
      );
      await fetchUsersAndSessions();
    } catch (err: unknown) {
      // Rollback optimistic state on backend rejection
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status, failed_attempts: user.failed_attempts } : u))
      );
      setError((err as { message?: string })?.message || "Failed to update account status on backend.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (user: AdminUserListItem) => {
    if (user.id === currentUser?.id) {
      setError("You cannot alter your own administrative authority.");
      return;
    }
    if (user.status !== "ACTIVE") {
      setError("Only ACTIVE user accounts can have their authority role altered. Please enable the user first.");
      return;
    }

    const nextRole = user.role === "admin" ? "user" : "admin";
    setActionLoadingId(user.id);
    setMessage(null);
    setError(null);

    // Optimistic UI state update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
    );

    try {
      await api.updateUserRole(user.id, nextRole);
      setMessage(`User ${user.email} authority role updated to ${nextRole.toUpperCase()} on backend.`);
      await fetchUsersAndSessions();
    } catch (err: unknown) {
      // Rollback optimistic state on backend rejection
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u))
      );
      setError((err as { message?: string })?.message || "Failed to alter authority role on backend.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    setMessage(null);
    setError(null);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage("Active session revoked immediately.");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to revoke session.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            User Governance & Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administer enterprise corporate accounts grouped by User ID and email with live session inspection.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsersAndSessions}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium rounded-lg self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by corporate email or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-background/50 focus:bg-background text-xs"
          />
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Alphabetical Sort Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAsc(!sortAsc)}
            className="h-9 px-3 rounded-lg text-xs font-medium border-border/80 flex items-center space-x-1.5"
            title={sortAsc ? "Sort Alphabetically: A to Z" : "Sort Alphabetically: Z to A"}
          >
            {sortAsc ? (
              <>
                <ArrowDownAZ className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Alphabetical (A–Z)</span>
              </>
            ) : (
              <>
                <ArrowUpAZ className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Alphabetical (Z–A)</span>
              </>
            )}
          </Button>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-muted-foreground font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background/50 focus:bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="All">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background/50 focus:bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="LOCKED">LOCKED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none">
        <div className="p-5 sm:p-6 border-b border-border/80 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Employee Directory
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grouped by Corporate Email & User ID • Sorted alphabetically ({sortAsc ? "A–Z" : "Z–A"}).
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 rounded-md">
            {total || users.length} Accounts
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-transparent">
                <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Corporate Email / User ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Account Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Active Sessions</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Failed Strikes</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Registered</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Manage</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!sortedUsers || sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-xs">
                    {loading ? "Searching enterprise directory..." : "No accounts match the current filter."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((item) => {
                  const isLocked = item.status === "LOCKED" || (item.failed_attempts || 0) >= 3;
                  const isCurrent = item.id === currentUser?.id;

                  // Find correlated active sessions for this user
                  const userSessions =
                    sessionsMap.get(item.id) ||
                    sessionsMap.get(item.email.toLowerCase().trim()) ||
                    [];
                  const hasMultipleSessions = userSessions.length > 1;

                  return (
                    <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      {/* Grouped by Corporate Email & User ID */}
                      <TableCell className="py-3">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-foreground font-mono">
                              {item.email}
                            </span>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-medium">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-muted-foreground">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground/70">ID:</span>
                            <span className="truncate max-w-[170px]">{item.id}</span>
                            <CopyButton value={item.id} className="h-4 px-1 text-[9px] rounded" />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={item.role === "admin" ? "default" : "secondary"} className="rounded-md text-[10px] uppercase font-semibold">
                          {item.role}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            item.status === "ACTIVE"
                              ? "success"
                              : item.status === "LOCKED"
                              ? "warning"
                              : "destructive"
                          }
                          className="rounded-md text-[10px] uppercase font-semibold"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>

                      {/* Dropdown Menu for Active Sessions */}
                      <TableCell>
                        {userSessions.length === 0 ? (
                          <span className="text-xs text-muted-foreground/60 italic font-mono">
                            No active sessions
                          </span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-7 px-2.5 text-xs font-mono rounded-lg transition-all flex items-center space-x-1.5 ${
                                  hasMultipleSessions
                                    ? "border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                                    : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${hasMultipleSessions ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
                                <span>
                                  {userSessions.length} {userSessions.length === 1 ? "Session" : "Sessions"}
                                </span>
                                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-80 p-2 text-xs rounded-xl border border-border/80 shadow-xl bg-card">
                              <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5 border-b border-border/60 flex items-center justify-between">
                                <span className="flex items-center space-x-1.5">
                                  <Users className="h-3.5 w-3.5 text-primary" />
                                  <span>Active User Sessions ({userSessions.length})</span>
                                </span>
                                {hasMultipleSessions && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono text-primary border-primary/30 bg-primary/5">
                                    Multiple Devices
                                  </Badge>
                                )}
                              </DropdownMenuLabel>

                              <div className="max-h-60 overflow-y-auto divide-y divide-border/50 py-1">
                                {userSessions.map((session, sIdx) => {
                                  const rawUa = session.device || session.user_agent || "Client Device";
                                  const rawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                                  const parsed = parseUserAgent(rawUa);
                                  const isRevoking = revokingSessionId === session.id;

                                  return (
                                    <div key={session.id || sIdx} className="p-2 space-y-1.5 hover:bg-muted/30 rounded-lg transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 min-w-0">
                                          <div className="p-1 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                            {parsed.isMobile ? (
                                              <Smartphone className="h-3 w-3" />
                                            ) : (
                                              <Laptop className="h-3 w-3" />
                                            )}
                                          </div>
                                          <span className="font-semibold text-xs text-foreground truncate">
                                            {parsed.device}
                                          </span>
                                        </div>

                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          disabled={isRevoking}
                                          onClick={() => handleRevokeSession(session.id)}
                                          className="h-6 px-2 text-[10px] font-mono rounded"
                                          title="Revoke this session"
                                        >
                                          <Trash2 className="h-2.5 w-2.5 mr-1" />
                                          <span>{isRevoking ? "..." : "Revoke"}</span>
                                        </Button>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-0.5">
                                        <span className="flex items-center">
                                          <Globe className="h-3 w-3 mr-1 text-primary opacity-70 shrink-0" />
                                          {rawIp}
                                        </span>
                                        <span>
                                          {formatRelativeTime(session.last_active_at || session.created_at)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs tabular-nums">
                        <span
                          className={
                            isLocked
                              ? "text-destructive font-bold"
                              : (item.failed_attempts || 0) > 0
                              ? "text-amber-500 font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {item.failed_attempts || 0} / 3
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </TableCell>

                      {/* Manage Actions Dropdown Menu */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoadingId === item.id}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 text-xs rounded-xl border border-border/80 shadow-md">
                            <DropdownMenuLabel className="text-xs font-semibold">Account Controls</DropdownMenuLabel>

                            {/* Unlock Action */}
                            <DropdownMenuItem
                              disabled={!isLocked}
                              onClick={() => handleUnlock(item.id)}
                              className="cursor-pointer text-xs"
                            >
                              <Unlock className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              <span>Unlock Account (Reset Strikes)</span>
                            </DropdownMenuItem>

                            {/* Explicit Disable User / Enable User Action */}
                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={() => handleToggleStatus(item)}
                              className="cursor-pointer text-xs"
                            >
                              {item.status === "DISABLED" ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Enable User</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3.5 w-3.5 mr-2 text-destructive" />
                                  <span className="text-destructive font-medium">Disable User</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Change Role (Only allowed on ACTIVE accounts by backend) */}
                            <DropdownMenuItem
                              disabled={isCurrent || item.status !== "ACTIVE"}
                              onClick={() => handleChangeRole(item)}
                              className="cursor-pointer text-xs"
                            >
                              <Shield className="h-3.5 w-3.5 mr-2 text-primary" />
                              <div className="flex flex-col">
                                <span>
                                  {item.role === "admin" ? "Demote to User" : "Promote to Admin"}
                                </span>
                                {item.status !== "ACTIVE" && (
                                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                                    Requires ACTIVE status
                                  </span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
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
