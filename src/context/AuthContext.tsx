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
    const health = await api.checkHealth({ timeoutMs: 2500 });
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
      const existingToken = api.getToken();

      let cachedUser: UserProfile | null = null;
      try {
        const stored = sessionStorage.getItem("vaultauth_user");
        if (stored) cachedUser = JSON.parse(stored);
      } catch {
        // ignore
      }

      // 1. If unauthenticated, render auth pages immediately without blocking
      if (!existingToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // 2. If token and cached user exist, hydrate immediately for instant visual response
      if (cachedUser && isMounted) {
        setToken(existingToken);
        setUser(cachedUser);
        setIsLoading(false);
      }

      // 3. Revalidate session against live backend
      try {
        const profile = await api.getMe({ skipAuthExpiredEvent: true, timeoutMs: 4000 });
        if (isMounted) {
          setToken(existingToken);
          setUser(profile);
          sessionStorage.setItem("vaultauth_user", JSON.stringify(profile));
          setIsServiceUnavailable(false);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        const apiErr = err as { status?: number };
        if (apiErr.status === 401) {
          // Token expired or invalidated on backend
          api.clearToken();
          if (isMounted) {
            setToken(null);
            setUser(null);
            setSessionExpiredNotice(null);
            setIsLoading(false);
          }
        } else if (apiErr.status === 0 || (apiErr.status && apiErr.status >= 500)) {
          // Backend unreachable or offline
          if (isMounted) {
            if (!cachedUser) {
              setIsServiceUnavailable(true);
            }
            setIsLoading(false);
          }
        } else {
          // Other error
          if (isMounted) {
            if (!cachedUser) {
              api.clearToken();
              setToken(null);
              setUser(null);
            }
            setIsLoading(false);
          }
        }
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
