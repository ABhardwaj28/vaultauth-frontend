import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CopyButton } from "@/components/ui/copy-button";

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
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="font-mono text-xs">
                {status} • {code}
              </Badge>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {extraContent}

            {/* Collapsible Technical Diagnostics */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full border border-border rounded-md p-2 bg-muted/20">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-xs font-mono text-muted-foreground hover:text-foreground text-left"
                >
                  <span className="flex items-center">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span>Technical Diagnostics</span>
                  </span>
                  <span className="text-[10px] uppercase opacity-75">
                    {isOpen ? "Hide" : "Inspect"}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 text-[11px] font-mono space-y-1.5 text-muted-foreground">
                <div className="flex items-center justify-between pt-1 border-t border-border">
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
                    <div className="flex items-center">
                      <span className="truncate max-w-[150px] text-foreground mr-1">
                        {requestId}
                      </span>
                      <CopyButton value={requestId} className="h-5 px-1 text-[10px]" />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Timestamp:</span>
                  <span className="text-foreground">{currentTime}</span>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            {primaryAction.href ? (
              <Button asChild className="w-full sm:w-auto flex-1">
                <Link to={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button onClick={primaryAction.onClick} className="w-full sm:w-auto flex-1">
                {primaryAction.label}
              </Button>
            )}

            {secondaryAction &&
              (secondaryAction.href ? (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button onClick={secondaryAction.onClick} variant="outline" className="w-full sm:w-auto">
                  {secondaryAction.label}
                </Button>
              ))}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
