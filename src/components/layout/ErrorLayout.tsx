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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="relative overflow-hidden w-full max-w-md rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary/[0.04] before:via-transparent before:to-transparent before:pointer-events-none space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="font-mono text-xs rounded-md">
                {status} • {code}
              </Badge>
              <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
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

      <footer className="py-4 border-t border-border/80 text-center text-xs text-muted-foreground">
        © 2026 VaultAuth SSO • All rights reserved
      </footer>
    </div>
  );
}
