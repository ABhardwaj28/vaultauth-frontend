import { useState, useEffect } from "react";
import { ServerOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceUnavailablePageProps {
  onRetry?: () => void;
  retrying?: boolean;
}

export function ServiceUnavailablePage({ onRetry, retrying }: ServiceUnavailablePageProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (retrying) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRetry?.();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry, retrying]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-6">
      <div className="relative overflow-hidden max-w-md w-full rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-destructive/[0.04] before:via-transparent before:to-transparent before:pointer-events-none text-center space-y-4">
        <div className="space-y-2 pb-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-destructive mb-3 shadow-xs">
            <ServerOff className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Service Unavailable
          </h1>
          <p className="text-xs text-muted-foreground">
            VaultAuth identity and session gateway is currently unreachable.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed text-left">
            The authentication gateway could not establish a connection to the backend server. The service may be offline, undergoing cold-start wake up, or your network connection might be interrupted.
          </p>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 text-left font-mono text-[11px] space-y-1">
            <div className="text-muted-foreground">Status: <span className="text-destructive font-semibold">HTTP 503 / Offline</span></div>
            <div className="text-muted-foreground">Endpoint: <span className="text-foreground">{import.meta.env.VITE_API_BASE_URL || "https://api.vaultauth.proplays2312.eu.org"}</span></div>
          </div>

          <Button
            onClick={onRetry}
            disabled={retrying}
            className="w-full h-10 text-xs font-semibold rounded-lg shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
            <span>
              {retrying
                ? "Connecting to gateway..."
                : `Auto-reconnecting in ${countdown}s (or Retry Now)`}
            </span>
          </Button>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        © 2026 VaultAuth SSO • All rights reserved
      </footer>
    </div>
  );
}
