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
      setSessions(data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to load active sessions.");
      // Fallback display if in local development
      setSessions([
        {
          id: "sess_curr_workstation",
          ip_address: "127.0.0.1",
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          is_current: true,
          current: true,
        },
      ]);
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
      setMessage("Session successfully invalidated. The associated bearer token is revoked.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to revoke session.");
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
            My Active Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active workstations and devices currently authenticated with your enterprise credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
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

      {/* Sessions Table Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                Authorized Sessions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Instant self-revocation terminates the token immediately in the database.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {sessions.length} Active {sessions.length === 1 ? "Session" : "Sessions"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Device & Client</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs">
                      {loading ? "Inspecting session telemetry..." : "No active sessions found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session, index) => {
                    const isCurrent = session.current || session.is_current || index === 0;
                    const parsed = parseUserAgent(session.user_agent);

                    return (
                      <TableRow key={session.id || index}>
                        <TableCell>
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1.5 rounded-md border border-border bg-muted/30">
                              {parsed.isMobile ? (
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Laptop className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-medium text-xs text-foreground">
                                  {parsed.device}
                                </span>
                                {isCurrent && (
                                  <Badge variant="success" className="text-[10px] py-0 px-1.5">
                                    Current Device
                                  </Badge>
                                )}
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[220px] cursor-help">
                                    {session.user_agent || "Corporate Workstation"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs break-all font-mono text-[11px]">
                                  {session.user_agent}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          <span className="flex items-center text-muted-foreground">
                            <Globe className="h-3 w-3 mr-1 opacity-70" />
                            {session.ip_address || "127.0.0.1"}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatRelativeTime(session.last_active_at || session.created_at)}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(session.created_at)}
                        </TableCell>

                        <TableCell className="text-right">
                          {!isCurrent ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={revokingId === session.id}
                              onClick={() => handleRevoke(session.id)}
                              className="h-7 px-2.5 text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span>{revokingId === session.id ? "Revoking..." : "Revoke"}</span>
                            </Button>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground italic mr-2">
                              This Session
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
        </CardContent>
      </Card>
    </div>
  );
}
