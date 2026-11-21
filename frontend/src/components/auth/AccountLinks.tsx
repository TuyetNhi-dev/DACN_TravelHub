"use client";

import Link from "next/link";
import { NewRequestBadge } from "@/components/admin/NewRequestBadge";
import { useSignOut } from "@/hooks/useSignOut";
import { accountLinks } from "@/lib/auth";
import { isCurrentPath } from "@/lib/disclosure-menu";
import type { AuthUser } from "@/types/auth";

interface AccountLinksProps {
  user: AuthUser;
  pathname: string;
  newRequests: number;
  /** Called after any choice (closes the dropdown or the hamburger panel). */
  onNavigate?: () => void;
}

/**
 * Name, email and the account entries. The same list sits in the header dropdown (desktop) and in the
 * hamburger panel (phones and tablets); `data-menu-item` lets useDisclosureMenu move focus with the arrow keys.
 */
export function AccountLinks({ user, pathname, newRequests, onNavigate }: AccountLinksProps) {
  const { busy, error, signOut } = useSignOut(onNavigate);
  return (
    <>
      <p className="account-identity">
        <b>{user.fullName}</b>
        <span>{user.email}</span>
      </p>
      <ul className="account-links">
        {accountLinks(user).map(link => {
          const current = isCurrentPath(pathname, link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} data-menu-item="" aria-current={current ? "page" : undefined}
                className={current ? "is-current" : undefined} onClick={onNavigate}>
                {link.label}
                {link.showsNewRequests && <NewRequestBadge count={newRequests} />}
              </Link>
            </li>
          );
        })}
        <li className="account-signout">
          <button type="button" data-menu-item="" disabled={busy} onClick={() => void signOut()}>
            {busy ? "Đang thoát…" : "Đăng xuất"}
          </button>
        </li>
      </ul>
      {error && <p className="sh-error" role="alert">{error}</p>}
    </>
  );
}
