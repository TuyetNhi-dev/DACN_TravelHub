"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";
import { useSignOut } from "@/hooks/useSignOut";
import { activeAdminHref, visibleNav } from "@/lib/admin-nav";
import { NewRequestBadge } from "../NewRequestBadge";
import { useAdmin } from "./AdminProvider";

export function AdminSidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { context } = useAdmin();
  const { count } = useNewRequestCount();
  const current = activeAdminHref(usePathname());
  const groups = visibleNav(context.capabilities);
  const { busy, error: signOutError, signOut } = useSignOut();
  return (
    <nav id="admin-sidebar" className={open ? "adm-sidebar open" : "adm-sidebar"} aria-label="Quản trị">
      <Link href="/admin" className="adm-brand" onClick={onNavigate}>
        <span className="adm-brand-mark" aria-hidden="true">SH</span>
        <span>SàiHành<small>QUẢN TRỊ</small></span>
      </Link>
      <div className="adm-nav-scroll">
        {groups.map(group => <div key={group.title} className="adm-group">
          <p className="adm-group-title">{group.title}</p>
          {group.items.map(item => <Link key={item.href} href={item.href} onClick={onNavigate}
            aria-current={item.href === current ? "page" : undefined}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.badge && <NewRequestBadge count={count} />}
          </Link>)}
        </div>)}
      </div>
      <div className="adm-sidebar-footer">
        {signOutError && <p className="adm-sidebar-error" role="alert">{signOutError}</p>}
        <button type="button" onClick={() => void signOut()} disabled={busy}>
          <Icon name="logout" size={18} />{busy ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
      </div>
    </nav>
  );
}
