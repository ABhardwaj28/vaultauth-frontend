import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  User,
  Laptop,
  Settings,
  Layers,
  Users,
  FileText,
  Radio,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";

export function DashboardShell() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  // Navigation Items
  const userNavItems = [
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: User,
      isActive: location.pathname === "/dashboard" || location.pathname === "/dashboard/profile",
    },
    {
      name: "Active Sessions",
      href: "/dashboard/sessions",
      icon: Laptop,
      isActive: location.pathname === "/dashboard/sessions",
    },
    {
      name: "Account Settings",
      href: "/dashboard/settings",
      icon: Settings,
      isActive: location.pathname === "/dashboard/settings",
    },
  ];

  const adminNavItems = [
    {
      name: "Application Management",
      href: "/dashboard/admin/apps",
      icon: Layers,
      isActive: location.pathname === "/dashboard/admin/apps",
    },
    {
      name: "User Management",
      href: "/dashboard/admin/users",
      icon: Users,
      isActive: location.pathname === "/dashboard/admin/users",
    },
    {
      name: "Security Audit Logs",
      href: "/dashboard/admin/audit-logs",
      icon: FileText,
      isActive: location.pathname === "/dashboard/admin/audit-logs",
    },
    {
      name: "Global Sessions",
      href: "/dashboard/admin/sessions",
      icon: Radio,
      isActive: location.pathname === "/dashboard/admin/sessions",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,hsl(var(--primary)/0.03),transparent_70%)] before:pointer-events-none">
      <TopBar />

      {/* Sub-Header Navigation Bar */}
      <div className="w-full border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 -mb-px">
            {/* User Navigation Links */}
            {userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                    item.isActive
                      ? "bg-primary/10 text-primary border border-primary/25 font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 mr-1.5", item.isActive ? "text-primary" : "opacity-70")} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin Navigation Links */}
            {isAdmin && (
              <>
                <div className="flex items-center space-x-2 mx-2 shrink-0 select-none pointer-events-none">
                  <div className="h-4 w-px bg-border" />
                  <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Admin
                  </span>
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                        item.isActive
                          ? "bg-primary/10 text-primary border border-primary/25 font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 mr-1.5", item.isActive ? "text-primary" : "opacity-70")} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground font-mono bg-card">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">VaultAuth SSO</span>
            <span className="text-border">|</span>
            <span>Enterprise Identity Gateway</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Enterprise Identity Platform</span>
            <span className="text-border">•</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
