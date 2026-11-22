import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserProfile } from "@/types/api";
import { api } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isServiceUnavailable: boolean;
  sessionExpiredNotice: string | null;
  setSessionExpiredNotice: (msg: string | null) => void;
  setAuthSession: (token: string, user: UserProfile) => void;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  checkServiceAvailability: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState<boolean>(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      setSessionExpiredNotice(null);
      await api.logout();
    } catch {
      // ignore
    } finally {
      api.clearToken();
      setToken(null);
      setUser(null);
      sessionStorage.removeItem("vaultauth_user");
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const currentToken = api.getToken();
    if (!currentToken) {
      setUser(null);
      return null;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
      sessionStorage.setItem("vaultauth_user", JSON.stringify(profile));
      return profile;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        logout();
        setSessionExpiredNotice("Your session has expired. Please sign in again.");
      }
      return null;
    }
  }, [logout]);

  const checkServiceAvailability = useCallback(async (): Promise<boolean> => {
    const health = await api.checkHealth({ timeoutMs: 4000, retries: 2 });
    if (health.ok) {
      setIsServiceUnavailable(false);
      return true;
    }
    setIsServiceUnavailable(true);
    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      // 1. Initial Service Connectivity Handshake (Parallel Fast Probes)
      try {
        const health = await api.checkHealth({ timeoutMs: 3500, retries: 2 });
        if (!health.ok) {
          if (isMounted) {
            setIsServiceUnavailable(true);
            setIsLoading(false);
          }
          return;
        }
      } catch {
        if (isMounted) {
          setIsServiceUnavailable(true);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) setIsServiceUnavailable(false);

      // 2. Hydrate Existing Session if token exists
      const existingToken = api.getToken();
      if (!existingToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await api.getMe({ skipAuthExpiredEvent: true, timeoutMs: 5000 });
        if (isMounted) {
          setToken(existingToken);
          setUser(profile);
          sessionStorage.setItem("vaultauth_user", JSON.stringify(profile));
        }
      } catch {
        // Stale or invalid token from prior session — silently clear it!
        // Never throw an authentication error or show an expired notice on initial startup.
        api.clearToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
          setSessionExpiredNotice(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initialize();

    // Listen to global session_expired events dispatched from ApiClient
    const handleSessionExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      api.clearToken();
      setToken(null);
      setUser(null);
      sessionStorage.removeItem("vaultauth_user");
      setSessionExpiredNotice(
        customEvent.detail?.message || "Your session has expired. Please sign in again."
      );
    };

    window.addEventListener("vaultauth:session_expired", handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener("vaultauth:session_expired", handleSessionExpired);
    };
  }, [logout]);

  const setAuthSession = (newToken: string, newUser: UserProfile) => {
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem("vaultauth_user", JSON.stringify(newUser));
    setSessionExpiredNotice(null);

    // Sync disabled directory accounts in the background if admin
    if (newUser.role === "admin") {
      api.getAdminUsers({ status: "DISABLED", limit: 200 }).then((res) => {
        const emails = (res.users || []).map((u) => u.email.toLowerCase().trim());
        const existing = JSON.parse(localStorage.getItem("vaultauth_disabled_accounts") || "[]");
        const merged = Array.from(new Set([...existing, ...emails]));
        localStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));
        sessionStorage.setItem("vaultauth_disabled_accounts", JSON.stringify(merged));
      }).catch(() => {});
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isServiceUnavailable,
        sessionExpiredNotice,
        setSessionExpiredNotice,
        setAuthSession,
        refreshProfile,
        logout,
        checkServiceAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
