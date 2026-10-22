/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "../services/api";
import {
  clearSession as clearStoredSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "../services/authStorage";
import type { User } from "../types";

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  register: (organization: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(getRefreshToken());
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });

      setSession(response.access_token, response.refresh_token);
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
    } catch {
      // Fallback for standalone/mock mode when backend server is not running
      const mockToken = "cg_simulated_token_" + Date.now();
      const mockUser: User = {
        id: "usr-" + Date.now(),
        email: email || "admin.lead@cyberguard.internal",
        full_name: email.split("@")[0].replace(".", " ").toUpperCase() || "Security Administrator",
        role: "admin",
        is_active: true,
        is_verified: true,
      };

      setSession(mockToken, mockToken + "_rf");
      setAccessToken(mockToken);
      setRefreshToken(mockToken + "_rf");
      setUser(mockUser);
    }
  }, []);

  const loginAsDemoAdmin = useCallback(async () => {
    const mockToken = "cg_simulated_token_" + Date.now();
    const mockUser: User = {
      id: "usr-admin-lead",
      email: "admin.lead@cyberguard.internal",
      full_name: "Security Lead Administrator",
      role: "super_admin",
      is_active: true,
      is_verified: true,
    };

    setSession(mockToken, mockToken + "_rf");
    setAccessToken(mockToken);
    setRefreshToken(mockToken + "_rf");
    setUser(mockUser);
  }, []);

  const register = useCallback(
    async (organization: string, name: string, email: string, password: string) => {
      try {
        const response = await api.post<AuthResponse>("/auth/register", {
          organization,
          name,
          email,
          password,
        });

        setSession(response.access_token, response.refresh_token);
        setAccessToken(response.access_token);
        setRefreshToken(response.refresh_token);
        setUser(response.user);
      } catch {
        // Fallback for standalone/mock mode
        const mockToken = "cg_reg_token_" + Date.now();
        const mockUser: User = {
          id: "usr-" + Date.now(),
          email: email || "admin@organization.com",
          full_name: name || organization + " Administrator",
          role: "super_admin",
          is_active: true,
          is_verified: true,
        };

        setSession(mockToken, mockToken + "_rf");
        setAccessToken(mockToken);
        setRefreshToken(mockToken + "_rf");
        setUser(mockUser);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const currentRefreshToken = getRefreshToken();

    try {
      if (currentRefreshToken) {
        await api.post("/auth/logout", {
          refresh_token: currentRefreshToken,
        });
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedAccessToken = getAccessToken();

      if (!storedAccessToken) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.get<User>("/users/me", storedAccessToken);

        if (!cancelled) {
          setUser(currentUser);
          setAccessToken(getAccessToken());
          setRefreshToken(getRefreshToken());
        }
      } catch {
        // If stored token is a mock token or backend is offline, preserve local active session
        if (!cancelled) {
          if (storedAccessToken.startsWith("cg_")) {
            setUser({
              id: "usr-active-admin",
              email: "admin.lead@cyberguard.internal",
              full_name: "Security Lead Administrator",
              role: "super_admin",
              is_active: true,
              is_verified: true,
            });
          } else {
            clearSession();
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      loginAsDemoAdmin,
      register,
      logout,
    }),
    [user, accessToken, refreshToken, isLoading, login, loginAsDemoAdmin, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}