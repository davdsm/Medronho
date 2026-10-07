import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, setUnauthorizedHandler } from "../lib/api";

export type AdminUser = { id: number; email: string; name: string; role: "admin" | "editor"; createdAt?: string };

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: AdminUser }>("GET", "/auth/me");
      setUser(user);
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) console.error(error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Sessão expirada durante o uso (401 em /admin) devolve ao início de sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: AdminUser }>("POST", "/auth/login", { email, password });
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("POST", "/auth/logout", {});
    } finally {
      setUser(null);
    }
  }, []);

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
