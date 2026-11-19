import { ShieldCheck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { user, logout } = useAuth();

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
