import { useState, useEffect } from "react";
import { Laptop, Smartphone, Globe, RefreshCw, Trash2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Active Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Workstations and browser instances currently authenticated with your enterprise credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium self-start sm:self-auto border-border hover:bg-muted/60"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sessions Table Card */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.035] before:via-transparent before:to-transparent before:pointer-events-none transition-all">
        <div className="p-5 sm:p-6 pb-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Authorized Devices
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Revoking a session immediately terminates its token in the authentication directory.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[11px] px-2.5 py-0.5">
            {sessions.length} Active {sessions.length === 1 ? "Session" : "Sessions"}
          </Badge>
        </div>

        <div className="p-0 overflow-x-auto">
          <TooltipProvider>
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Device & Workstation</TableHead>
                  <TableHead className="min-w-[140px]">IP Address</TableHead>
                  <TableHead className="min-w-[120px]">Last Active</TableHead>
                  <TableHead className="min-w-[160px]">Signed In</TableHead>
                  <TableHead className="min-w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          <span>Checking session directory...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1.5 py-4">
                          <ShieldCheck className="h-8 w-8 text-muted-foreground/60" />
                          <span className="font-medium text-foreground">No active sessions found</span>
                          <span className="text-[11px] text-muted-foreground">Sign in on a device to see it listed here.</span>
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
                      <TableRow key={session.id || index} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center space-x-3 py-1">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                              {parsed.isMobile ? (
                                <Smartphone className="h-4 w-4 text-primary" />
                              ) : (
                                <Laptop className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-foreground whitespace-nowrap">
                                  {parsed.device}
                                </span>
                                {isCurrent && (
                                  <Badge variant="success" className="text-[10px] py-0 px-1.5 shrink-0 whitespace-nowrap gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Current Device
                                  </Badge>
                                )}
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[280px] cursor-help block mt-0.5">
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

                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          <span className="flex items-center text-muted-foreground">
                            <Globe className="h-3.5 w-3.5 mr-1.5 opacity-70 shrink-0" />
                            {rawIp}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(session.last_active_at || session.created_at)}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(session.created_at)}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          {!isCurrent ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={revokingId === session.id}
                              onClick={() => handleRevoke(session.id)}
                              className="h-8 px-2.5 text-xs font-medium"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span>{revokingId === session.id ? "Revoking..." : "Revoke"}</span>
                            </Button>
                          ) : (
                            <span className="text-[11px] font-mono text-muted-foreground font-medium mr-2">
                              This Device
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
