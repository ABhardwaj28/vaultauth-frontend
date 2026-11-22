import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate overflow-hidden">
      {/* Ultra-diffused Soft Ambient Light Wash (Identical to Login / Auth Pages) */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* Large cloud-soft central diffused atmospheric aura directly behind card */}
        <div className="w-[640px] h-[480px] rounded-full bg-destructive/[0.04] dark:bg-destructive/[0.055] blur-[130px] pointer-events-none -translate-y-6" />

        {/* Gentle top atmospheric wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--destructive)/0.03),transparent_70%)] pointer-events-none" />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="relative overflow-hidden w-full max-w-md rounded-xl border border-border/80 bg-card p-6 sm:p-7 shadow-[0_4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-center space-y-4 transition-all">
          <div className="space-y-2 pb-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-3 shadow-xs">
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
      </main>

      <footer className="border-t border-border/80 py-4 px-4 text-center text-xs text-muted-foreground bg-card/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 VaultAuth SSO • Enterprise Identity Gateway</span>
          <div className="flex items-center space-x-3 text-[11px]">
            <Link to="/privacy" className="hover:text-foreground hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">•</span>
            <Link to="/terms" className="hover:text-foreground hover:underline transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">•</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
