import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  User,
  Laptop,
  Settings,
  Layers,
  Users,
  FileText,
  Radio,
  Shield,
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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
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
                      ? "bg-[#F6821F]/10 text-[#F6821F] border border-[#F6821F]/30 font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 mr-1.5", item.isActive ? "text-[#F6821F]" : "opacity-70")} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin Navigation Links */}
            {isAdmin && (
              <>
                <div className="h-4 w-px bg-border mx-2 shrink-0" />
                <div className="hidden sm:inline-flex items-center px-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  <Shield className="w-3 h-3 mr-1 text-[#F6821F]" />
                  Admin
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
                          ? "bg-[#F6821F]/10 text-[#F6821F] border border-[#F6821F]/30 font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 mr-1.5", item.isActive ? "text-[#F6821F]" : "opacity-70")} />
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
            <span>Argon2id Memory-Hard</span>
            <span className="text-border">•</span>
            <span>NIST SP 800-63B</span>
            <span className="text-border">•</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
