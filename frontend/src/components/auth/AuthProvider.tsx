"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authRequest, type Session } from "@/lib/auth";

type AuthState = { session: Session | null; loading: boolean; error: string; refresh: (force?: boolean) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pending = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const refresh = useCallback((force = false) => {
    if (!force && pending.current) return pending.current;
    if (force) generation.current++;
    const current = generation.current;
    const request = (async () => {
      try {
        const value = await authRequest<Session | null>("me");
        if (current === generation.current) { setSession(value); setError(""); }
      } catch {
        if (current === generation.current) setError("Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.");
      } finally {
        if (current === generation.current) setLoading(false);
      }
    })();
    pending.current = request;
    void request.finally(() => { if (pending.current === request) pending.current = null; });
    return request;
  }, []);
  const logout = useCallback(async () => {
    await authRequest("logout", {});
    generation.current++; pending.current = null;
    setSession(null); setError(""); setLoading(false);
  }, []);
  useEffect(() => {
    const refreshSession = () => { void refresh(); };
    const initial = window.setTimeout(refreshSession, 0);
    const timer = window.setInterval(refreshSession, 60_000);
    window.addEventListener("focus", refreshSession);
    window.addEventListener("saihanh-auth-change", refreshSession);
    return () => { clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", refreshSession); window.removeEventListener("saihanh-auth-change", refreshSession); };
  }, [refresh]);
  useEffect(() => {
    if (!session?.expiresAt) return;
    const timer = window.setTimeout(() => { setSession(null); void refresh(); }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [session, refresh]);
  return <AuthContext.Provider value={{ session, loading, error, refresh, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
