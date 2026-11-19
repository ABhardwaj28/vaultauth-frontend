import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Utility Bar */}
      <header className="w-full border-b border-border bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                VaultAuth
              </span>
              <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Identity
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
              Zero-Trust Architecture
            </span>
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

      {/* Engineering Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VaultAuth SSO • High-Assurance Zero-Trust Engine</span>
          <div className="flex items-center space-x-3">
            <span>NIST SP 800-63B</span>
            <span>•</span>
            <span>Argon2id</span>
            <span>•</span>
            <span>FIDO2 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
