import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-primary/30 bg-primary/10 text-primary",
    secondary: "border-border bg-secondary text-secondary-foreground",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
    outline: "text-foreground border-border bg-card",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-[#F6821F]/30 bg-[#F6821F]/10 text-[#F6821F]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium font-mono tracking-tight transition-colors select-none border",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
