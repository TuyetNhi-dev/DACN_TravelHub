"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { loginHref } from "@/lib/auth";
import { useAuth } from "./AuthProvider";

/** Pages that should not become the post-login destination. */
const AUTH_PAGES = ["/login", "/register", "/verify-email"];

function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

export function AuthActions({ onNavigate }: { onNavigate?: () => void }) {
  const { session, loading, logout } = useAuth();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      onNavigate?.();
      router.push("/");
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể đăng xuất.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <span className="auth-header-name" aria-live="polite">Đang kiểm tra phiên…</span>;
  if (!session) {
    const login = AUTH_PAGES.includes(pathname) ? "/login" : loginHref(pathname);
    return (
      <>
        <Link className="btn btn-ghost auth-login-btn" href={login} onClick={onNavigate}
          aria-current={pathname === "/login" ? "page" : undefined}>
          <Icon name="users" size={18} />Đăng nhập
        </Link>
        <Link className="btn btn-primary" href="/register" onClick={onNavigate}
          aria-current={pathname === "/register" ? "page" : undefined}>Đăng ký</Link>
      </>
    );
  }
  return (
    <>
      <Link className="btn btn-ghost auth-user-chip" href="/account" onClick={onNavigate}
        title={session.user.fullName}>
        <span className="auth-avatar" aria-hidden="true">{initials(session.user.fullName)}</span>
        <span className="auth-header-name">{session.user.fullName}</span>
      </Link>
      <Link className="btn btn-ghost" href="/bookings" onClick={onNavigate}>Đơn của tôi</Link>
      <button className="btn btn-ghost" disabled={busy} onClick={() => void signOut()}>
        {busy ? "Đang thoát…" : "Đăng xuất"}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
