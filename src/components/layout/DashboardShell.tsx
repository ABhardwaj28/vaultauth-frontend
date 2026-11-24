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

  // Breadcrumb label — derived from the exact same route checks as before.
  const currentSection = location.pathname.includes("admin/apps")
    ? "Applications"
    : location.pathname.includes("admin/users")
    ? "Users"
    : location.pathname.includes("admin/audit-logs")
    ? "Audit Logs"
    : location.pathname.includes("admin/sessions")
    ? "Global Sessions"
    : location.pathname.includes("sessions")
    ? "Sessions"
    : location.pathname.includes("settings")
    ? "Settings"
    : "Overview";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,hsl(var(--primary)/0.03),transparent_70%)] before:pointer-events-none">
      <TopBar />

      {/* Section navigation — quiet, hairline-led rhythm */}
      <div className="w-full border-b border-border bg-card/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto -mb-px">
            {/* User Navigation Links */}
            {userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3.5 font-display text-[13px] transition-colors",
                    item.isActive
                      ? "border-foreground font-semibold text-foreground"
                      : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", item.isActive ? "opacity-100" : "opacity-60")} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin Navigation Links */}
            {isAdmin && (
              <>
                <div className="flex items-center gap-2.5 mx-2 shrink-0 select-none pointer-events-none">
                  <span className="h-3.5 w-px bg-border" />
                  <span className="font-display text-[11px] font-medium text-muted-foreground/70">
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
                        "relative inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3.5 font-display text-[13px] transition-colors",
                        item.isActive
                          ? "border-foreground font-semibold text-foreground"
                          : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", item.isActive ? "opacity-100" : "opacity-60")} />
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 flex items-center gap-2 font-display text-[12px] text-muted-foreground">
          <span>VaultAuth</span>
          <span className="text-border">/</span>
          <span>Access</span>
          <span className="text-border">/</span>
          <span className="font-semibold text-foreground">{currentSection}</span>
        </div>
        <Outlet />
      </main>

      {/* Minimal Footer — hairline-separated, no decorative dots */}
      <footer className="border-t border-border py-5 px-4 font-display text-[11px] text-muted-foreground bg-card/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-foreground">VaultAuth SSO</span>
            <span className="h-3 w-px bg-border" />
            <span>Enterprise Identity Gateway</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Enterprise Identity Platform</span>
            <span className="h-3 w-px bg-border" />
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
