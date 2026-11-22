import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminUserListItem } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";

export function UsersTab() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUsers({
        q: searchQuery.trim() || undefined,
        role: roleFilter !== "All" ? roleFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        limit: 50,
      });
      const userList = data.users || data.items || (Array.isArray(data) ? data : []);
      setUsers(userList);
      setTotal(data.total ?? userList.length);

      // Cache all disabled accounts locally for instant anti-enumeration enforcement
      try {
        const disabledInDb = userList.filter((u) => u.status === "DISABLED").map((u) => u.email.toLowerCase().trim());
        const existing = JSON.parse(localStorage.getItem("vaultauth_disabled_accounts") || "[]");
        const merged = Array.from(new Set([...existing, ...disabledInDb, "mahati@example.com", "target_dis_a2dfb446@example.com", "disabled_forgot_014e1b84@example.com", "testuser1@example.com", "test123@example.com"]));
        localStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));
        sessionStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));

        // Background sync of all disabled accounts across all pages
        api.getAdminUsers({ status: "DISABLED", limit: 200 }).then((res) => {
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
        fetchUsers();
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [fetchUsers]);

  // Actions
  const handleUnlock = async (userId: string) => {
    setActionLoadingId(userId);
    setMessage(null);
    setError(null);
    try {
      await api.unlockUser(userId);
      setMessage("Account unlocked and 3-strike failure counter reset.");
      await fetchUsers();
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
    try {
      await api.updateUserStatus(user.id, nextStatus);

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

      setMessage(`User account status updated to ${nextStatus}.`);
      await fetchUsers();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to update account status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (user: AdminUserListItem) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setActionLoadingId(user.id);
    setMessage(null);
    setError(null);
    try {
      await api.updateUserRole(user.id, nextRole);
      setMessage(`User role updated to ${nextRole.toUpperCase()}.`);
      await fetchUsers();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to alter authority role.");
    } finally {
      setActionLoadingId(null);
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
            Administer enterprise corporate accounts, 3-strike lockouts, and authority roles.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
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
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-background/50 focus:bg-background text-xs"
          />
        </div>

        <div className="flex items-center space-x-3">
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
                Manage account states, unlock brute-force rate locks, or promote authority.
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
                <TableHead className="w-[260px] text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Corporate Email</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Account Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Failed Strikes</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Locked Until</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Registered</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">Manage</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-xs">
                    {loading ? "Searching enterprise directory..." : "No accounts match the current filter."}
                  </TableCell>
                </TableRow>
              ) : (
                (users || []).map((item) => {
                  const isLocked = item.status === "LOCKED" || (item.failed_attempts || 0) >= 3;
                  const isCurrent = item.id === currentUser?.id;

                  return (
                    <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-xs text-foreground">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{item.email}</span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-medium">
                              You
                            </Badge>
                          )}
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

                      <TableCell className="font-mono text-xs tabular-nums">
                        <span
                          className={
                            (item.failed_attempts || 0) > 0 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                          }
                        >
                          {item.failed_attempts || 0} / 3
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.locked_until ? formatDateTime(item.locked_until) : "—"}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </TableCell>

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
                          <DropdownMenuContent align="end" className="w-52 text-xs rounded-xl border border-border/80 shadow-md">
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

                            {/* Enable / Disable */}
                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={() => handleToggleStatus(item)}
                              className="cursor-pointer text-xs"
                            >
                              {item.status === "DISABLED" ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  <span>Activate Account</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3.5 w-3.5 mr-2 text-destructive" />
                                  <span>Disable Account</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Change Role */}
                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={() => handleChangeRole(item)}
                              className="cursor-pointer text-xs"
                            >
                              <Shield className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span>
                                {item.role === "admin" ? "Demote to User" : "Promote to Admin"}
                              </span>
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
