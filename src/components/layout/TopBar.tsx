import { ShieldCheck, LogOut, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORGANISATION_NAME } from "@/lib/organisation";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            {/* Brand Logo Icon */}
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                VaultAuth
              </span>
              <span className="text-[10px] font-mono font-medium text-primary uppercase tracking-wider">
                SSO
              </span>
            </div>
          </Link>

          {/* Organisation / tenant placeholder — configurable via VITE_ORGANISATION_NAME */}
          <div className="hidden items-center gap-2 rounded-md border border-border/80 bg-muted/50 px-2.5 py-1 sm:flex">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {ORGANISATION_NAME}
            </span>
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
