import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ErrorLayoutProps {
  status: number | string;
  code: string;
  title: string;
  description: string;
  requestId?: string;
  timestamp?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  extraContent?: React.ReactNode;
}

export function ErrorLayout({
  status,
  code,
  title,
  description,
  requestId,
  timestamp,
  primaryAction = { label: "Return to Dashboard", href: "/dashboard" },
  secondaryAction,
  extraContent,
}: ErrorLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentTime = timestamp || new Date().toISOString();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150 relative isolate overflow-hidden">
      {/* Ultra-diffused Soft Ambient Light Wash (Identical to Login / Auth Pages) */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* Large cloud-soft central diffused atmospheric aura directly behind card */}
        <div className="w-[640px] h-[480px] rounded-full bg-primary/[0.045] dark:bg-primary/[0.055] blur-[130px] pointer-events-none -translate-y-6" />

        {/* Gentle top atmospheric wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.035),transparent_70%)] pointer-events-none" />
      </div>

      <TopBar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <div className="relative overflow-hidden w-full max-w-md rounded-xl border border-border/80 bg-card p-6 sm:p-7 shadow-[0_4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-5 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="font-mono text-xs rounded-md">
                {status} • {code}
              </Badge>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="space-y-4">
            {extraContent}

            {/* Collapsible Technical Diagnostics */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full border border-border/80 rounded-lg p-3 bg-muted/20">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-xs font-mono text-muted-foreground hover:text-foreground text-left focus:outline-none"
                >
                  <span className="flex items-center">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 mr-1 text-primary" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 mr-1 text-primary" />
                    )}
                    <span className="font-medium font-sans">Technical Diagnostics</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono opacity-75">
                    {isOpen ? "Hide" : "Inspect"}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2.5 text-[11px] font-mono space-y-1.5 text-muted-foreground">
                <div className="flex items-center justify-between pt-1.5 border-t border-border/80">
                  <span>Status Code:</span>
                  <span className="text-foreground">{status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Code:</span>
                  <span className="text-foreground">{code}</span>
                </div>
                {requestId && (
                  <div className="flex items-center justify-between">
                    <span>Request ID:</span>
                    <span className="text-foreground font-mono truncate max-w-[150px]">{requestId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Timestamp:</span>
                  <span className="text-foreground">{currentTime}</span>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2 pt-1">
              {primaryAction.href ? (
                <Button asChild className="w-full h-10 font-semibold rounded-lg shadow-xs">
                  <Link to={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              ) : (
                <Button onClick={primaryAction.onClick} className="w-full h-10 font-semibold rounded-lg shadow-xs">
                  {primaryAction.label}
                </Button>
              )}

              {secondaryAction && (
                secondaryAction.href ? (
                  <Button asChild variant="outline" className="w-full h-9 rounded-lg text-xs font-medium">
                    <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button onClick={secondaryAction.onClick} variant="outline" className="w-full h-9 rounded-lg text-xs font-medium">
                    {secondaryAction.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </main>

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
