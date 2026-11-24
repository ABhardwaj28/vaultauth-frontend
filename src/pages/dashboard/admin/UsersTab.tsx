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

const ROLE_FILTERS = [
  { value: "All", label: "All Roles" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTERS = [
  { value: "All", label: "All Statuses" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "LOCKED", label: "LOCKED" },
  { value: "DISABLED", label: "DISABLED" },
];

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

  const fetchUsersAndSessions = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    if (forceRefresh) {
      api.invalidateUserCache();
    }
    try {
      const [usersData, sessionsData] = await Promise.all([
        api.getAdminUsers({ limit: 100, fetchAll: true }),
        api.getGlobalSessions(100).catch(() => [] as SessionItem[]),
      ]);

      const userList = usersData.users || usersData.items || (Array.isArray(usersData) ? usersData : []);
      setUsers(userList);
      setTotal(usersData.total ?? userList.length);
      setSessions(sessionsData || []);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load directory users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndSessions();
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

  // Filter in memory for instantaneous 0ms search & filter response
  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== "All") {
      list = list.filter((u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase());
    }
    if (statusFilter !== "All") {
      list = list.filter((u) => (u.status || "").toUpperCase() === statusFilter.toUpperCase());
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.id || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Group and sort alphabetically by Corporate Email
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const comp = (a.email || "").toLowerCase().localeCompare((b.email || "").toLowerCase(), undefined, { sensitivity: "base" });
      return sortAsc ? comp : -comp;
    });
  }, [filteredUsers, sortAsc]);

  // Actions
  const handleUnlock = async (userId: string) => {
    setActionLoadingId(userId);
    setMessage(null);
    setError(null);
    try {
      await api.unlockUser(userId);
      setMessage("Account unlocked and 3-strike failure counter reset.");
      await fetchUsersAndSessions(true);
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
      await fetchUsersAndSessions(true);
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
      await fetchUsersAndSessions(true);
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
    <div className="space-y-5 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            User governance and access control
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Corporate accounts with live session inspection. Changes apply immediately.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsersAndSessions(true)}
          disabled={loading}
          className="h-8 shrink-0 self-start rounded-md border-border px-3 text-sm font-medium sm:self-auto"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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

      {/* Search and filter chips */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-md border-border/70 bg-background/60 pl-9 text-sm focus:bg-card"
          />
        </div>

        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="space-y-1.5">
            <span className="block text-[11px] text-muted-foreground">Role</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {ROLE_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRoleFilter(option.value)}
                  aria-pressed={roleFilter === option.value}
                  className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                    roleFilter === option.value
                      ? "border-primary/40 bg-primary/[0.06] text-primary"
                      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] text-muted-foreground">Status</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    statusFilter === option.value
                      ? "border-primary/40 bg-primary/[0.06] text-primary"
                      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {option.value !== "All" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      option.value === "ACTIVE"
                        ? "bg-emerald-500"
                        : option.value === "LOCKED"
                        ? "bg-amber-500"
                        : "bg-destructive"
                    }`} />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAsc(!sortAsc)}
            className="h-8 rounded-md border-border/70 px-2.5 text-[12px] font-medium"
            title={sortAsc ? "Sort by email, A to Z" : "Sort by email, Z to A"}
          >
            {sortAsc ? (
              <ArrowDownAZ className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ArrowUpAZ className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            )}
            {sortAsc ? "A to Z" : "Z to A"}
          </Button>
        </div>
      </div>

      {/* One directory surface */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-foreground">
              Employee directory
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              Sorted by email, {sortAsc ? "A to Z" : "Z to A"}
            </span>
            <Badge variant="outline" className="rounded-md px-2 py-0 font-mono text-[11px] text-muted-foreground">
              {total || users.length} accounts
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[300px] py-2.5 font-sans normal-case tracking-normal">Corporate email</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Role</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Status</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Sessions</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Failed strikes</TableHead>
                <TableHead className="py-2.5 font-sans normal-case tracking-normal">Registered</TableHead>
                <TableHead className="py-2.5 text-right font-sans normal-case tracking-normal">Manage</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!sortedUsers || sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    {loading ? "Reading the directory" : "No accounts match the current filters."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((item) => {
                  const isLocked = item.status === "LOCKED" || (item.failed_attempts || 0) >= 3;
                  const isCurrent = item.id === currentUser?.id;

                  const userSessions =
                    sessionsMap.get(item.id) ||
                    sessionsMap.get(item.email.toLowerCase().trim()) ||
                    [];
                  const hasMultipleSessions = userSessions.length > 1;

                  return (
                    <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/25">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 font-display text-[11px] font-semibold text-muted-foreground">
                            {(item.email || item.id || "?").slice(0, 2).toUpperCase()}
                          </span>
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium text-foreground">
                                {item.email}
                              </span>
                              {isCurrent && (
                                <span className="shrink-0 rounded border border-border/70 bg-background/60 px-1.5 py-0 text-[10px] text-muted-foreground">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                              <span className="text-[10px] text-muted-foreground/70">ID</span>
                              <span className="max-w-[170px] truncate">{item.id}</span>
                              <CopyButton value={item.id} className="h-4 rounded px-1 text-[9px]" />
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.role === "admin" ? "bg-foreground/60" : "bg-muted-foreground/50"}`} />
                          {item.role === "admin" ? "Admin" : "User"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 font-mono text-[10px] text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : item.status === "LOCKED"
                              ? "bg-amber-500"
                              : "bg-destructive"
                          }`} />
                          {item.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        {userSessions.length === 0 ? (
                          <span className="font-mono text-[11px] italic text-muted-foreground/60">
                            None
                          </span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 rounded-md border-border/70 bg-background/60 px-2.5 font-mono text-[11px] hover:bg-muted/40"
                              >
                                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${hasMultipleSessions ? "bg-foreground/60" : "bg-emerald-500"}`} />
                                {userSessions.length} {userSessions.length === 1 ? "session" : "sessions"}
                                <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-80 rounded-md border border-border bg-card p-1.5 text-sm shadow-lg">
                              <DropdownMenuLabel className="flex items-center justify-between border-b border-border/60 px-2 py-1.5 text-[12px] font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                  Active sessions ({userSessions.length})
                                </span>
                                {hasMultipleSessions && (
                                  <span className="font-mono text-[10px] text-muted-foreground">Multiple devices</span>
                                )}
                              </DropdownMenuLabel>

                              <div className="max-h-60 divide-y divide-border/60 py-1">
                                {userSessions.map((session, sIdx) => {
                                  const rawUa = session.device || session.user_agent || "Client device";
                                  const rawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                                  const parsed = parseUserAgent(rawUa);
                                  const isRevoking = revokingSessionId === session.id;

                                  return (
                                    <div key={session.id || sIdx} className="space-y-1.5 rounded-sm px-2 py-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <div className="shrink-0 rounded border border-border/70 bg-muted/40 p-1 text-muted-foreground">
                                            {parsed.isMobile ? (
                                              <Smartphone className="h-3 w-3" />
                                            ) : (
                                              <Laptop className="h-3 w-3" />
                                            )}
                                          </div>
                                          <span className="truncate text-[13px] font-medium text-foreground">
                                            {parsed.device}
                                          </span>
                                        </div>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={isRevoking}
                                          onClick={() => handleRevokeSession(session.id)}
                                          className="h-6 rounded-md border-border/70 bg-transparent px-2 text-[11px] text-destructive hover:border-destructive/40 hover:bg-destructive/[0.04]"
                                          title="Revoke this session"
                                        >
                                          <Trash2 className="mr-1 h-2.5 w-2.5" />
                                          {isRevoking ? "..." : "Revoke"}
                                        </Button>
                                      </div>

                                      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                                        <span className="flex items-center">
                                          <Globe className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" />
                                          {rawIp}
                                        </span>
                                        <span>{formatRelativeTime(session.last_active_at || session.created_at)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-[12px] tabular-nums">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isLocked
                              ? "bg-destructive"
                              : (item.failed_attempts || 0) > 0
                              ? "bg-amber-500"
                              : "bg-muted-foreground/40"
                          }`} />
                          {item.failed_attempts || 0} / 3
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoadingId === item.id}
                              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-md border border-border bg-card p-1.5 text-sm shadow-lg">
                            <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-medium">
                              Account controls
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              disabled={!isLocked}
                              onClick={() => handleUnlock(item.id)}
                              className="cursor-pointer text-[13px]"
                            >
                              <Unlock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              <span>Unlock account (reset strikes)</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={() => handleToggleStatus(item)}
                              className="cursor-pointer text-[13px]"
                            >
                              {item.status === "DISABLED" ? (
                                <>
                                  <UserCheck className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Enable user</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Disable user</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              disabled={isCurrent || item.status !== "ACTIVE"}
                              onClick={() => handleChangeRole(item)}
                              className="cursor-pointer text-[13px]"
                            >
                              <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{item.role === "admin" ? "Demote to user" : "Promote to admin"}</span>
                                {item.status !== "ACTIVE" && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Requires active status
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
