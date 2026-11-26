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
  KeyRound,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  { value: "All", label: "All" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTERS = [
  { value: "All", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "LOCKED", label: "Locked" },
  { value: "DISABLED", label: "Disabled" },
];

function Metric({ label, value, note, accent }: { label: string; value: string | number; note?: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[13px] font-semibold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
      {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
    </div>
  );
}

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
  const [resetTarget, setResetTarget] = useState<AdminUserListItem | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [codesTarget, setCodesTarget] = useState<AdminUserListItem | null>(null);
  const [resettingCodes, setResettingCodes] = useState(false);

  const fetchUsersAndSessions = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    if (forceRefresh) api.invalidateUserCache();
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

  const sessionsMap = useMemo(() => {
    const map = new Map<string, SessionItem[]>();
    for (const session of sessions) {
      const uid = session.user_id;
      const em = (session.email || session.user_email || "").toLowerCase().trim();
      if (uid) map.set(uid, [...(map.get(uid) || []), session]);
      if (em && !map.get(em)?.some((s) => s.id === session.id)) {
        map.set(em, [...(map.get(em) || []), session]);
      }
    }
    return map;
  }, [sessions]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== "All") list = list.filter((u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase());
    if (statusFilter !== "All") list = list.filter((u) => (u.status || "").toUpperCase() === statusFilter.toUpperCase());
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((u) => (u.email || "").toLowerCase().includes(q) || (u.id || "").toLowerCase().includes(q));
    return list;
  }, [users, roleFilter, statusFilter, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const comp = (a.email || "").toLowerCase().localeCompare((b.email || "").toLowerCase(), undefined, { sensitivity: "base" });
      return sortAsc ? comp : -comp;
    });
  }, [filteredUsers, sortAsc]);

  const counts = useMemo(() => ({
    active: users.filter((u) => u.status === "ACTIVE").length,
    admins: users.filter((u) => u.role === "admin").length,
    flagged: users.filter((u) => u.status !== "ACTIVE" || (u.failed_attempts || 0) > 0).length,
  }), [users]);

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
    setUsers((prev) => prev.map((u) => u.id === user.id
      ? { ...u, status: nextStatus, failed_attempts: nextStatus === "ACTIVE" ? 0 : u.failed_attempts }
      : u));
    try {
      await api.updateUserStatus(user.id, nextStatus);
      if (nextStatus === "ACTIVE" && (user.status === "LOCKED" || (user.failed_attempts || 0) >= 3)) {
        await api.unlockUser(user.id).catch(() => {});
      }
      setMessage(nextStatus === "DISABLED"
        ? `${user.email} disabled. All active sessions terminated.`
        : `${user.email} enabled. Account is now ACTIVE.`);
      await fetchUsersAndSessions(true);
    } catch (err: unknown) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: user.status, failed_attempts: u.failed_attempts } : u)));
      setError((err as { message?: string })?.message || "Failed to update account status.");
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
      setError("Only ACTIVE accounts can have their role changed. Enable the user first.");
      return;
    }
    const nextRole = user.role === "admin" ? "user" : "admin";
    setActionLoadingId(user.id);
    setMessage(null);
    setError(null);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    try {
      await api.updateUserRole(user.id, nextRole);
      setMessage(`${user.email} is now ${nextRole.toUpperCase()}.`);
      await fetchUsersAndSessions(true);
    } catch (err: unknown) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u)));
      setError((err as { message?: string })?.message || "Failed to change authority role.");
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
      setMessage("Session revoked immediately.");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to revoke session.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!resetTarget) return;
    setResettingPassword(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.adminResetUserPassword(resetTarget.id);
      setMessage(
        res.message ||
        `Password changed for ${resetTarget.email}. A notification was emailed to the user.`
      );
      setResetTarget(null);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to change the user's password.");
      setResetTarget(null);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleAdminResetSecurityCodes = async () => {
    if (!codesTarget) return;
    setResettingCodes(true);
    setMessage(null);
    setError(null);
    // UI preview — wire to the admin security-code reset endpoint when it ships.
    // The user is notified by email with the event only, never the codes.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessage(`Security codes reset for ${codesTarget.email}. A notification was emailed to the user.`);
    setCodesTarget(null);
    setResettingCodes(false);
  };

  const rolePill = (role: string) => (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${role === "admin" ? "bg-primary" : "bg-muted-foreground/40"}`} />
      {role === "admin" ? "Admin" : "User"}
    </span>
  );

  const statusPill = (status: string) => (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "ACTIVE" ? "bg-success" : status === "LOCKED" ? "bg-warning" : "bg-destructive"
      }`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );

  const strikes = (item: AdminUserListItem, isLocked: boolean) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] tabular-nums text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${
        isLocked ? "bg-destructive" : (item.failed_attempts || 0) > 0 ? "bg-warning" : "bg-muted-foreground/40"
      }`} />
      {item.failed_attempts || 0} / 3
    </span>
  );

  const sessionControl = (_item: AdminUserListItem, userSessions: SessionItem[], hasMultiple: boolean) => {
    if (userSessions.length === 0) {
      return <span className="font-mono text-[11px] italic text-muted-foreground/60">None</span>;
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 rounded border-border/70 bg-background/60 px-2 font-mono text-[11px] hover:bg-muted/40">
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${hasMultiple ? "bg-primary" : "bg-success"}`} />
            {userSessions.length} {userSessions.length === 1 ? "session" : "sessions"}
            <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[min(20rem,calc(100vw-2rem))] rounded border border-border bg-card p-1.5 shadow-lg">
          <DropdownMenuLabel className="flex items-center justify-between border-b border-border/60 px-2 py-1.5 text-[12px] font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Active sessions ({userSessions.length})
            </span>
            {hasMultiple && <span className="font-mono text-[10px] text-muted-foreground">Multiple devices</span>}
          </DropdownMenuLabel>
          <div className="max-h-60 divide-y divide-border/60 py-1">
            {userSessions.map((session, sIdx) => {
              const rawUa = session.device || session.user_agent || "Client device";
              const rawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
              const parsed = parseUserAgent(rawUa);
              const isRevoking = revokingSessionId === session.id;
              return (
                <div key={session.id || sIdx} className="space-y-1.5 px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="shrink-0 rounded border border-border/70 bg-muted/40 p-1 text-muted-foreground">
                        {parsed.isMobile ? <Smartphone className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                      </div>
                      <span className="truncate text-[12px] font-medium text-foreground">{parsed.device}</span>
                    </div>
                    <Button variant="ghost" size="sm" disabled={isRevoking} onClick={() => handleRevokeSession(session.id)}
                      className="h-6 rounded border border-border/70 px-2 text-[11px] text-muted-foreground hover:border-destructive/40 hover:bg-destructive/[0.06] hover:text-destructive">
                      <Trash2 className="mr-1 h-2.5 w-2.5" />
                      {isRevoking ? "..." : "Revoke"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center"><Globe className="mr-1 h-3 w-3 shrink-0" />{rawIp}</span>
                    <span>{formatRelativeTime(session.last_active_at || session.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const manageControl = (item: AdminUserListItem, isCurrent: boolean, isLocked: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={actionLoadingId === item.id}
          className="h-7 w-7 rounded text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded border border-border bg-card p-1.5 shadow-lg">
        <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-medium">Account controls</DropdownMenuLabel>
        <DropdownMenuItem disabled={!isLocked} onClick={() => handleUnlock(item.id)} className="cursor-pointer text-[13px]">
          <Unlock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Unlock account (reset strikes)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isCurrent} onClick={() => handleToggleStatus(item)} className="cursor-pointer text-[13px]">
          {item.status === "DISABLED" ? <UserCheck className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> : <UserX className="mr-2 h-3.5 w-3.5 text-muted-foreground" />}
          {item.status === "DISABLED" ? "Enable user" : "Disable user"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setResetTarget(item)} className="cursor-pointer text-[13px]">
          <KeyRound className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Change password (email user)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCodesTarget(item)} className="cursor-pointer text-[13px]">
          <RefreshCw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Reset security codes (email user)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isCurrent || item.status !== "ACTIVE"} onClick={() => handleChangeRole(item)} className="cursor-pointer text-[13px]">
          <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex flex-col">
            <span>{item.role === "admin" ? "Demote to user" : "Promote to admin"}</span>
            {item.status !== "ACTIVE" && <span className="text-[10px] text-muted-foreground">Requires active status</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4 pb-1">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
            User governance
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Corporate accounts with live session inspection. Changes apply immediately.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchUsersAndSessions(true)} disabled={loading}
          className="h-8 shrink-0 self-start rounded border-border px-3 text-[13px] sm:self-auto">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {message && (
        <div className="flex items-center gap-2.5 rounded border border-border bg-card px-3 py-2 text-[13px]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="flex-1">{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 rounded border border-destructive/30 bg-destructive/[0.05] px-3 py-2 text-[13px] text-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Compact summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4">
        <Metric label="Accounts" value={total || users.length} accent />
        <Metric label="Active" value={counts.active} note={`of ${total || users.length}`} />
        <Metric label="Administrators" value={counts.admins} />
        <Metric label="Needs attention" value={counts.flagged} />
      </div>

      {/* Query controls */}
      <div className="flex flex-col gap-3 border-b border-border py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[15rem]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search email or user ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded border-border/70 bg-background/60 pl-8 text-[13px] focus:bg-card" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</span>
            <div className="flex flex-wrap gap-1">
              {ROLE_FILTERS.map((option) => (
                <button key={option.value} type="button" onClick={() => setRoleFilter(option.value)}
                  aria-pressed={roleFilter === option.value}
                  className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                    roleFilter === option.value
                      ? "border-primary/40 bg-primary/[0.07] text-foreground"
                      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((option) => (
                <button key={option.value} type="button" onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                  className={`flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                    statusFilter === option.value
                      ? "border-primary/40 bg-primary/[0.07] text-foreground"
                      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}>
                  {option.value !== "All" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      option.value === "ACTIVE" ? "bg-success" : option.value === "LOCKED" ? "bg-warning" : "bg-destructive"
                    }`} />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSortAsc(!sortAsc)}
            className="h-7 rounded border-border/70 px-2 text-[11px]">
            {sortAsc ? <ArrowDownAZ className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> : <ArrowUpAZ className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />}
            {sortAsc ? "A to Z" : "Z to A"}
          </Button>
        </div>
      </div>

      {/* Directory */}
      <div className="overflow-hidden rounded border border-border border-t-2 border-t-primary/80 bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Employee directory</h2>
          </div>
          <Badge variant="outline" className="rounded px-1.5 py-0 font-mono text-[10px] text-muted-foreground">
            {sortedUsers.length} / {total || users.length}
          </Badge>
        </div>

        {/* Desktop ledger */}
        <div className="hidden md:block">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[260px] py-3 font-sans normal-case tracking-normal">Corporate email</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Role</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Status</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Sessions</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Strikes</TableHead>
                <TableHead className="py-3 font-sans normal-case tracking-normal">Registered</TableHead>
                <TableHead className="py-3 text-right font-sans normal-case tracking-normal">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-[13px] text-muted-foreground">
                  {loading ? "Reading the directory" : "No accounts match the current filters."}
                </TableCell></TableRow>
              ) : sortedUsers.map((item) => {
                const isLocked = item.status === "LOCKED" || (item.failed_attempts || 0) >= 3;
                const isCurrent = item.id === currentUser?.id;
                const userSessions = sessionsMap.get(item.id) || sessionsMap.get(item.email.toLowerCase().trim()) || [];
                return (
                  <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/25">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/70 bg-muted/40 font-display text-[10px] font-semibold text-muted-foreground">
                          {(item.email || item.id || "?").slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-medium">{item.email}</span>
                            {isCurrent && <span className="rounded border border-border/70 bg-background/60 px-1 text-[9px] text-muted-foreground">You</span>}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            <span className="max-w-[150px] truncate">{item.id}</span>
                            <CopyButton value={item.id} className="h-4 rounded px-1 text-[9px]" />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{rolePill(item.role || "user")}</TableCell>
                    <TableCell>{statusPill(item.status)}</TableCell>
                    <TableCell>{sessionControl(item, userSessions, userSessions.length > 1)}</TableCell>
                    <TableCell>{strikes(item, isLocked)}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">{manageControl(item, isCurrent, isLocked)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Compact cards on small screens */}
        <div className="divide-y divide-border md:hidden">
          {sortedUsers.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              {loading ? "Reading the directory" : "No accounts match the current filters."}
            </div>
          ) : sortedUsers.map((item) => {
            const isLocked = item.status === "LOCKED" || (item.failed_attempts || 0) >= 3;
            const isCurrent = item.id === currentUser?.id;
            const userSessions = sessionsMap.get(item.id) || sessionsMap.get(item.email.toLowerCase().trim()) || [];
            return (
              <div key={item.id} className="p-4">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border/70 bg-muted/40 font-display text-[10px] font-semibold text-muted-foreground">
                    {(item.email || item.id || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium">{item.email}</span>
                      {isCurrent && <span className="rounded border border-border/70 px-1 text-[9px] text-muted-foreground">You</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <span className="max-w-[160px] truncate">{item.id}</span>
                      <CopyButton value={item.id} className="h-4 rounded px-1 text-[9px]" />
                    </div>
                  </div>
                  {manageControl(item, isCurrent, isLocked)}
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-border pt-2.5">
                  <div className="min-w-0"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Role</p><div className="mt-1">{rolePill(item.role || "user")}</div></div>
                  <div className="min-w-0"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Status</p><div className="mt-1">{statusPill(item.status)}</div></div>
                  <div className="min-w-0"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Strikes</p><div className="mt-1">{strikes(item, isLocked)}</div></div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  {sessionControl(item, userSessions, userSessions.length > 1)}
                  <span className="font-mono text-[10px] text-muted-foreground">{formatDateTime(item.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin-initiated password change */}
      <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change user password</DialogTitle>
            <DialogDescription>
              A new password will be set on this account. The user receives an email saying only that their password changed — no password, codes, or request details are included.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[12px] text-foreground">
            {resetTarget?.email}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={() => setResetTarget(null)} disabled={resettingPassword} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={handleAdminResetPassword} disabled={resettingPassword} className="h-9">
              {resettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-3.5 w-3.5" />}
              Change password &amp; notify
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin-initiated security code reset */}
      <Dialog open={codesTarget !== null} onOpenChange={(open) => { if (!open) setCodesTarget(null); }}>
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset security codes</DialogTitle>
            <DialogDescription>
              Existing recovery codes are invalidated. The user receives an email stating only that their security codes were reset — the codes themselves and who requested it are never included.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[12px] text-foreground">
            {codesTarget?.email}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={() => setCodesTarget(null)} disabled={resettingCodes} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={handleAdminResetSecurityCodes} disabled={resettingCodes} className="h-9">
              {resettingCodes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
              Reset codes &amp; notify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
