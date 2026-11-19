import { useState, useEffect } from "react";
import { Laptop, Smartphone, Globe, RefreshCw, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { SessionItem } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatRelativeTime, parseUserAgent } from "@/lib/utils";

export function GlobalSessionsTab() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGlobalSessions(50);
      setSessions(data);
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
      setMessage("Global session terminated. Token immediately expunged from database.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to terminate session.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            System-Wide Active Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry and centralized kill-switch across all authenticated users and workstations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchGlobalSessions}
          disabled={loading}
          className="h-8 text-xs font-mono self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
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

      {/* Table Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Centralized Session Directory
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Revoking any session enforces atomic rejection on the user's next request (&lt;30s).
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {sessions.length} Live Sessions
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">User Account</TableHead>
                  <TableHead>Client & Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Idle Expiration</TableHead>
                  <TableHead className="text-right">Kill-Switch</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">
                      {loading ? "Inspecting system sessions..." : "No live sessions found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session, index) => {
                    const rawUa = session.device || session.user_agent || "Corporate Workstation";
                    const rawIp = session.ip || session.ip_address || "—";
                    const rawEmail = session.email || session.user_email || session.user_id || "corporate_user";
                    const parsed = parseUserAgent(rawUa);

                    return (
                      <TableRow key={session.id || index}>
                        <TableCell className="font-mono text-xs text-foreground font-medium">
                          {rawEmail}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="p-1 rounded bg-muted/40 text-muted-foreground border border-border">
                              {parsed.isMobile ? (
                                <Smartphone className="h-3.5 w-3.5" />
                              ) : (
                                <Laptop className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-foreground truncate max-w-[150px] cursor-help">
                                  {parsed.device}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs break-all font-mono text-[11px]">
                                {rawUa}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1 opacity-70" />
                            {rawIp}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatRelativeTime(session.last_active_at || session.created_at)}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {session.expires_at ? formatDateTime(session.expires_at) : "Dynamic"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={revokingId === session.id}
                            onClick={() => handleRevoke(session.id)}
                            className="h-7 px-2.5 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span>{revokingId === session.id ? "Terminating..." : "Terminate"}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
