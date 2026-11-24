import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate overflow-hidden">
      {/* Ultra-diffused Soft Ambient Light Wash (No lines, no circles) */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* Large cloud-soft central diffused atmospheric aura directly behind card */}
        <div className="w-[640px] h-[480px] rounded-full bg-primary/[0.045] dark:bg-primary/[0.055] blur-[130px] pointer-events-none -translate-y-6" />

        {/* Gentle top atmospheric wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.035),transparent_70%)] pointer-events-none" />
      </div>

      {/* Top Utility Bar */}
      <header className="w-full border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <ShieldCheck className="w-4 h-4 text-primary" />
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

          <div className="flex items-center space-x-3">
            </div>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="w-full max-w-sm relative z-10">
          {children}
        </div>
      </main>

      {/* Legal / Trust Footer with Links to Unavailable Documentation */}
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
