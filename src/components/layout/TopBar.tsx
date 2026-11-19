import { useEffect, useState } from "react";
import { ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function TopBar() {
  const { user, logout, isAdmin } = useAuth();
  const [health, setHealth] = useState<{ checking: boolean; online: boolean; latency: number | null }>({
    checking: true,
    online: false,
    latency: null,
  });

  const checkApiHealth = async () => {
    setHealth((prev) => ({ ...prev, checking: true }));
    const res = await api.checkHealth();
    setHealth({
      checking: false,
      online: res.ok,
      latency: res.latency,
    });
  };

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              VaultAuth
            </span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              SSO
            </span>
          </div>
        </Link>

        {/* Center / Right Control Hub */}
        <div className="flex items-center space-x-3">
          {/* Live Backend Telemetry Pill */}
          <div
            className="hidden sm:inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-mono border border-border bg-muted/40 text-muted-foreground select-none"
            title="Backend Connectivity Telemetry"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                health.checking
                  ? "bg-amber-500 animate-pulse"
                  : health.online
                  ? "bg-emerald-500"
                  : "bg-destructive"
              }`}
            />
            <span className="tabular-nums">
              {health.checking
                ? "Connecting..."
                : health.online
                ? `API Online (${health.latency}ms)`
                : "API Offline"}
            </span>
            <button
              type="button"
              onClick={checkApiHealth}
              disabled={health.checking}
              className="hover:text-foreground focus:outline-none ml-0.5"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 ${health.checking ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* User Email & Role Badge */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-border">
              <span className="text-xs font-mono text-muted-foreground max-w-[160px] truncate">
                {user.email}
              </span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {user.role.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Logout Button */}
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
