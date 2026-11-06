"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthActions({ onNavigate }: { onNavigate?: () => void }) {
  const { session, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  if (loading) return <span className="auth-header-name" aria-live="polite">Đang kiểm tra phiên…</span>;
  if (!session) return <><Link className="btn btn-ghost" href="/login" onClick={onNavigate}>Đăng nhập</Link><Link className="btn btn-primary" href="/register" onClick={onNavigate}>Đăng ký</Link></>;
  return <><Link className="btn btn-ghost auth-header-name" href="/account" onClick={onNavigate} title={session.user.fullName}>{session.user.fullName}</Link>
    <button className="btn btn-ghost" disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await logout(); onNavigate?.(); router.refresh(); }
      catch (error) { setError(error instanceof Error ? error.message : "Không thể đăng xuất."); }
      finally { setBusy(false); }
    }}>{busy ? "Đang thoát…" : "Đăng xuất"}</button>{error && <span role="alert">{error}</span>}</>;
}
