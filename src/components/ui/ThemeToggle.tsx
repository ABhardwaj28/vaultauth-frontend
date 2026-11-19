import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-border bg-background hover:bg-muted/60"
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-foreground transition-transform duration-200" />
          ) : (
            <Sun className="h-4 w-4 text-foreground transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 border-border bg-popover">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center">
            <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Light</span>
          </span>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center">
            <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Dark</span>
          </span>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center">
            <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>System</span>
          </span>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
