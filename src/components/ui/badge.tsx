import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground shadow-sm",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive/15 text-destructive border-destructive/20",
    outline: "text-foreground border-border",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
