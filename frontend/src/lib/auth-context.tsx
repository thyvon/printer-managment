"use client";

import { api, ApiError, tokenStore } from "@/lib/api";
import type { Company, User } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  company: Company | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.get() ? "loading" : "unauthenticated"
  );
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback((user: User, token: string) => {
    tokenStore.set(token);
    setUser(user);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    let active = true;

    (async () => {
      try {
        const user = await api.get<User>("/user");
        if (!active) return;
        setUser(user);
        setStatus("authenticated");
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          tokenStore.clear();
        }
        setStatus("unauthenticated");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ user: User; token: string }>("/login", {
        email,
        password,
      });
      applySession(data.user, data.token);
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      company_name: string;
    }) => {
      const data = await api.post<{ user: User; token: string }>(
        "/register",
        payload
      );
      applySession(data.user, data.token);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore network errors on logout
    }
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      company: user?.company ?? null,
      login,
      register,
      logout,
    }),
    [status, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}