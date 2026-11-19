import { ServerOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ServiceUnavailablePageProps {
  onRetry?: () => void;
  retrying?: boolean;
}

export function ServiceUnavailablePage({ onRetry, retrying }: ServiceUnavailablePageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6">
      <Card className="max-w-md w-full border-border shadow-sm text-center">
        <CardHeader className="space-y-2 pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <ServerOff className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Service Unavailable
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            VaultAuth identity and session service is currently unreachable.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            The authentication gateway could not establish a connection to the backend server. The service may be offline, undergoing maintenance, or your network connection might be interrupted.
          </p>

          <div className="p-2.5 rounded-md bg-muted/40 border border-border text-left font-mono text-[11px] space-y-1">
            <div className="text-muted-foreground">Status: <span className="text-destructive font-semibold">HTTP 503 / Offline</span></div>
            <div className="text-muted-foreground">Endpoint: <span className="text-foreground">{import.meta.env.VITE_API_BASE_URL || "https://api.vaultauth.proplays2312.eu.org"}</span></div>
          </div>

          <Button
            onClick={onRetry}
            disabled={retrying}
            className="w-full h-9 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Checking connectivity..." : "Retry Connection"}</span>
          </Button>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-xs text-muted-foreground font-mono">
        © 2026 VaultAuth SSO • System Health Guard
      </footer>
    </div>
  );
}
