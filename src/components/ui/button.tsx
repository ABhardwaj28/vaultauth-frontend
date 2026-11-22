import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default:
        "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs border border-transparent active:scale-[0.99] transition-all",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent active:scale-[0.99] transition-all",
      outline:
        "border border-border bg-card hover:bg-muted text-foreground hover:border-border/80 shadow-sm active:scale-[0.99] transition-all",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 shadow-sm active:scale-[0.99] transition-all",
      ghost: "hover:bg-muted/70 hover:text-foreground text-muted-foreground transition-colors",
      link: "text-primary hover:text-primary/90 underline-offset-4 hover:underline font-medium p-0 h-auto",
    };

    const sizeClasses = {
      default: "h-9 px-4 py-2 text-xs font-medium rounded-md",
      sm: "h-8 rounded-md px-3 text-xs font-medium",
      lg: "h-10 rounded-md px-6 text-sm font-medium",
      icon: "h-8 w-8 p-0 rounded-md",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
