"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { loginHref } from "@/lib/auth";
import { AccountLinks } from "./AccountLinks";
import { AccountMenu } from "./AccountMenu";
import { useAuth } from "./AuthProvider";

/** Pages that should not become the post-login destination. */
const AUTH_PAGES = ["/login", "/register", "/verify-email"];

interface AuthActionsProps {
  /** "header": avatar dropdown in the desktop bar; "panel": the same entries listed in the hamburger panel. */
  variant?: "header" | "panel";
  /** New service requests (staff and admins), loaded once by the header for both variants. */
  newRequests?: number;
  onNavigate?: () => void;
}

export function AuthActions({ variant = "header", newRequests = 0, onNavigate }: AuthActionsProps) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <span className="auth-header-name" aria-live="polite">Đang kiểm tra phiên…</span>;
  if (!session) {
    const login = AUTH_PAGES.includes(pathname) ? "/login" : loginHref(pathname);
    return (
      <>
        <Link className="btn btn-ghost auth-login-btn" href={login} onClick={onNavigate}
          aria-current={pathname === "/login" ? "page" : undefined}>
          <Icon name="users" size={18} />Đăng nhập
        </Link>
        {/* The desktop bar keeps one short account button (like the avatar when signed in): with the cart icon,
            even "Đăng nhập / Đăng ký" overflows at 1220 and 1440px. Sign-up is a clear button on the login page,
            and is also in the hamburger panel and the footer. */}
        {variant === "panel" && (
          <Link className="btn btn-primary" href="/register" onClick={onNavigate}
            aria-current={pathname === "/register" ? "page" : undefined}>Đăng ký</Link>
        )}
      </>
    );
  }
  if (variant === "panel") {
    return (
      <div className="account-panel account-panel--inline">
        <AccountLinks user={session.user} pathname={pathname} newRequests={newRequests} onNavigate={onNavigate} />
      </div>
    );
  }
  return <AccountMenu user={session.user} pathname={pathname} newRequests={newRequests} />;
}
