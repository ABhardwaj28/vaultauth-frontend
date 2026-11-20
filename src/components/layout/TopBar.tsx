import { ShieldCheck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            {/* Safety Amber Icon */}
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#F6821F] text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                VaultAuth
              </span>
              <span className="text-[10px] font-mono font-medium text-[#F6821F] uppercase tracking-wider">
                SSO
              </span>
            </div>
          </Link>

          {/* Operational Status Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">Gateway Operational</span>
          </div>
        </div>

        {/* Right Control Hub */}
        <div className="flex items-center space-x-3">
          {/* User Email & Role Badge */}
          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-border">
              <span className="hidden md:inline text-xs font-mono text-muted-foreground max-w-[180px] truncate">
                {user.email}
              </span>
              <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-border bg-muted/40 text-foreground">
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
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
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
