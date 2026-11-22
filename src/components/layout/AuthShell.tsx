import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate overflow-hidden">
      {/* Precision Security Perimeter & Atmospheric Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* Soft Ambient Radial Illumination */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,hsl(var(--primary)/0.06),transparent_80%)]" />

        {/* Concentric Architectural Security Rings with Smooth Radial Fade */}
        <div className="absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_65%_65%_at_50%_50%,#000_20%,transparent_90%)]">
          <div className="w-[460px] h-[460px] rounded-full border border-primary/[0.08] dark:border-primary/[0.12]" />
          <div className="absolute w-[680px] h-[680px] rounded-full border border-primary/[0.05] dark:border-primary/[0.08]" />
          <div className="absolute w-[920px] h-[920px] rounded-full border border-primary/[0.03] dark:border-primary/[0.05]" />
          <div className="absolute w-[1180px] h-[1180px] rounded-full border border-primary/[0.015] dark:border-primary/[0.025]" />
        </div>

        {/* Hairline Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="w-full max-w-sm relative z-10">
          {children}
        </div>
      </main>

      {/* Legal / Trust Footer */}
      <footer className="border-t border-border/80 py-4 px-4 text-center text-xs text-muted-foreground bg-card/60 backdrop-blur-md">
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
