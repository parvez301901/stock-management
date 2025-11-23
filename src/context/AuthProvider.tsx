"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export type AuthUser = {
  id?: number | string;
  name?: string;
  email?: string;
  [key: string]: any;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser;
  ready: boolean;
  login: (token: string, user?: AuthUser) => void;
  logout: () => void;
  setUser: (u: AuthUser) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const savedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      setReady(true);
    } catch {}
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (!token) return;
      try {
        const me = await authApi.me();
        setUser(me ?? null);
      } catch {}
    };
    sync();
    // we don't want to re-fetch on user change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    try {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    } catch {}
  }, [token]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem("user", JSON.stringify(user));
      else localStorage.removeItem("user");
    } catch {}
  }, [user]);

  const login = (newToken: string, newUser?: AuthUser) => {
    setToken(newToken);
    if (newUser !== undefined) setUser(newUser ?? null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    router.push("/signin");
  };

  const value = useMemo<AuthContextType>(
    () => ({ isAuthenticated: Boolean(token), token, user, ready, login, logout, setUser }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
