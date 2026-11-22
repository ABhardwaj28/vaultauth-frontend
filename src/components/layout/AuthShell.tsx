import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate before:fixed before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(246,130,31,0.025),transparent_70%)] before:pointer-events-none">
      {/* Top Utility Bar */}
      <header className="w-full border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4 text-primary" />
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

          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      {/* Legal / Trust Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground font-mono bg-card">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 VaultAuth SSO • Enterprise Identity Gateway</span>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Privacy Policy</span>
            <span className="text-border">•</span>
            <span>Terms of Service</span>
            <span className="text-border">•</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
