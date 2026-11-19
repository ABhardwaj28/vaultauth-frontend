import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserProfile } from "@/types/api";
import { api } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionExpiredNotice: string | null;
  setSessionExpiredNotice: (msg: string | null) => void;
  setAuthSession: (token: string, user: UserProfile) => void;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("vaultauth_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
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
        setSessionExpiredNotice("Your session has expired or was revoked. Please sign in again.");
      }
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const existingToken = api.getToken();
      if (!existingToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setToken(existingToken);
      try {
        const profile = await api.getMe();
        if (isMounted) {
          setUser(profile);
          sessionStorage.setItem("vaultauth_user", JSON.stringify(profile));
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (isMounted && status === 401) {
          logout();
          setSessionExpiredNotice("Your active session was invalidated. Please sign in again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    hydrate();

    // Listen to global session_expired events dispatched from ApiClient
    const handleSessionExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      logout();
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
        sessionExpiredNotice,
        setSessionExpiredNotice,
        setAuthSession,
        refreshProfile,
        logout,
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
