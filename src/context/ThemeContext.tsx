import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type Preference = "light" | "dark" | null;

interface ThemeContextType {
  /** "system" while following detection, otherwise the user's explicit choice. */
  theme: Theme;
  /** The theme actually applied to the document. */
  resolvedTheme: ResolvedTheme;
  /** True once the user has picked Light or Dark while signed in. */
  isUserControlled: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "vaultauth-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): Preference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // An explicit choice made by the user in Settings. Only honoured while signed in.
  const [preference, setPreference] = useState<Preference>(readPreference);
  // Live OS preference — tracked only on the public/auth screens.
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  // The OS value captured at the moment of sign-in; holds steady for the session.
  const [detectedAtLogin, setDetectedAtLogin] = useState<ResolvedTheme | null>(null);
  const wasAuthenticated = useRef(isAuthenticated);

  // Freeze detection on login and release it on logout.
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current) {
      setDetectedAtLogin(systemTheme);
    } else if (!isAuthenticated && wasAuthenticated.current) {
      setDetectedAtLogin(null);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, systemTheme]);

  // Follow the device only on auth screens. Once signed in, the user is in control.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "dark" : "light");

    if (!isAuthenticated) {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleChange);
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isAuthenticated]);

  const effectiveTheme: ResolvedTheme = isAuthenticated
    ? preference ?? detectedAtLogin ?? systemTheme
    : systemTheme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
  }, [effectiveTheme]);

  const setTheme = (next: Theme) => {
    if (next === "system") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // storage unavailable — keep the in-memory preference cleared
      }
      setPreference(null);
      if (!isAuthenticated) setSystemTheme(getSystemTheme());
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — the choice still applies for this session
    }
    setPreference(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: preference ?? "system",
        resolvedTheme: effectiveTheme,
        isUserControlled: isAuthenticated && preference !== null,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
