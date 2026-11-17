"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSession, logout as logoutRequest } from "@/services/auth";
import type { Session } from "@/types/auth";

const REFRESH_INTERVAL_MS = 60_000;
export const AUTH_CHANGE_EVENT = "saihanh-auth-change";

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // A newer refresh or a logout invalidates answers from older, slower requests.
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const value = await getSession();
      if (current === generation.current) { setSession(value); setError(""); }
    } catch {
      if (current === generation.current) setError("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    generation.current++;
    setSession(null);
    setError("");
  }, []);

  useEffect(() => {
    const onChange = () => { void refresh(); };
    const initial = window.setTimeout(onChange, 0);
    const timer = window.setInterval(onChange, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", onChange);
    window.addEventListener(AUTH_CHANGE_EVENT, onChange);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      window.removeEventListener("focus", onChange);
      window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    };
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ session, loading, error, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
