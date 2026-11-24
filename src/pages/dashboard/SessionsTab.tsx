import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Laptop, Smartphone, Globe, RefreshCw, Trash2, CheckCircle2, ShieldCheck, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

const SESSION_POLICY = [
  { label: "Idle timeout", value: "30 min" },
  { label: "Absolute limit", value: "8 hours" },
  { label: "MFA satisfied", value: "Email OTP" },
  { label: "Device posture", value: "Verified" },
];

export function SessionsTab() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMySessions();
      // Strictly filter to active, unrevoked, and unexpired sessions only
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
      setError((err as { message?: string })?.message || "Failed to load active sessions.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    setMessage(null);
    setError(null);

    try {
      await api.revokeSession(sessionId);
      setMessage("Session invalidated. The associated access token has been revoked.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || "";
      // If the session was already pruned or revoked on the server, remove it from view
      if (
        errMsg.toLowerCase().includes("not exist") ||
        errMsg.toLowerCase().includes("not found") ||
        errMsg.toLowerCase().includes("revoked")
      ) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setMessage("Session is no longer active and has been removed.");
      } else {
        setError(errMsg || "Failed to revoke session.");
      }
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-1">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Security / Session monitor</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            Active sessions
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Workstations and browsers currently authenticated with your enterprise credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="h-8 shrink-0 self-start rounded-lg px-3 text-xs font-medium sm:self-auto"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </header>

      {/* Notifications — colour carried by a status dot only */}
      {message && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 text-xs text-foreground shadow-sm dark:shadow-none">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 text-xs text-foreground shadow-sm dark:shadow-none">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        {/* The ledger — one surface, scrolls horizontally on narrow screens */}
        <TooltipProvider>
          <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm dark:shadow-none">
            <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="space-y-1">
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Authorized devices
                </h2>
                <p className="text-sm text-muted-foreground">
                  Revoking a session terminates its token in the authentication directory immediately.
                </p>
              </div>
              <span className="flex items-center gap-2 self-start rounded-md border border-border/70 bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground sm:self-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {sessions.length} active
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[780px]">
                <TableHeader>
                  <TableRow className="border-b border-border/70 bg-muted/20 hover:bg-muted/20">
                    <TableHead className="w-[290px] py-2.5 font-medium text-muted-foreground">Device</TableHead>
                    <TableHead className="py-2.5 font-medium text-muted-foreground">IP address</TableHead>
                    <TableHead className="py-2.5 font-medium text-muted-foreground">Last active</TableHead>
                    <TableHead className="py-2.5 font-medium text-muted-foreground">Signed in</TableHead>
                    <TableHead className="py-2.5 text-right font-medium text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="h-48 text-center text-xs text-muted-foreground">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            <span>Checking the session directory...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                            <ShieldCheck className="mb-0.5 h-7 w-7 text-muted-foreground/50" />
                            <span className="font-medium text-foreground">No active sessions</span>
                            <span>Sign in on a device to see it listed here.</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session, index) => {
                      const isCurrent = Boolean(session.current ?? session.is_current ?? (index === 0 && sessions.length === 1));
                      const rawUa = session.device || session.user_agent || "Enterprise Workstation";
                      const rawIp = (session.ip || session.ip_address || "—").replace(/\/32$/, "");
                      const parsed = parseUserAgent(rawUa);

                      return (
                        <TableRow key={session.id || index} className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/20">
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
                                {parsed.isMobile ? (
                                  <Smartphone className="h-3.5 w-3.5" />
                                ) : (
                                  <Laptop className="h-3.5 w-3.5" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate whitespace-nowrap font-display text-xs font-semibold text-foreground">
                                    {parsed.device}
                                  </span>
                                  {isCurrent && (
                                    <Badge variant="outline" className="shrink-0 gap-1.5 rounded-md px-1.5 py-0 font-sans text-[10px] font-medium text-muted-foreground">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      This device
                                    </Badge>
                                  )}
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="mt-0.5 block max-w-[250px] cursor-help truncate font-mono text-[11px] text-muted-foreground">
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

                          <TableCell className="font-mono text-xs text-muted-foreground">
                            <span className="flex items-center whitespace-nowrap">
                              <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                              {rawIp}
                            </span>
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {formatRelativeTime(session.last_active_at || session.created_at)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {formatDateTime(session.created_at)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-right">
                            {!isCurrent ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={revokingId === session.id}
                                onClick={() => handleRevoke(session.id)}
                                className="h-7 rounded-lg border-border/70 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                {revokingId === session.id ? "Revoking..." : "Revoke"}
                              </Button>
                            ) : (
                              <span className="mr-2 text-[11px] text-muted-foreground">Current session</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </TooltipProvider>

        {/* Context rail — quiet, no second glossy surface */}
        <aside className="flex flex-col gap-7 xl:border-l xl:border-border/80 xl:pl-6">
          <section>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <h2 className="font-display text-sm font-semibold text-foreground">Session policy</h2>
            </div>
            <dl className="mt-4 space-y-0 text-xs">
              {SESSION_POLICY.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5 last:border-0"
                >
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-mono font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="link" className="mt-3 h-auto p-0 text-xs font-medium">
              <Link to="/dashboard/settings">Manage session security</Link>
            </Button>
          </section>

          <section className="border-t border-border/80 pt-6">
            <h2 className="font-display text-sm font-semibold text-foreground">Revocation</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sessions are validated on every request. A revoked token is rejected on its next call,
              typically within 30 seconds.
            </p>
            <div className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span>Revoking this device signs you out everywhere except the current session.</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
