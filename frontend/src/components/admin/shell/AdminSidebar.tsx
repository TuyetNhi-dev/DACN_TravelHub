"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";
import type { AdminCapabilities } from "@/types/admin";
import { NewRequestBadge } from "../NewRequestBadge";
import { useAdmin } from "./AdminProvider";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Hidden when false; the API refuses the same pages anyway. */
  allowed?: (capabilities: AdminCapabilities) => boolean;
  badge?: boolean;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Tổng quan", items: [{ href: "/admin", label: "Bảng điều khiển", icon: "briefcase" }] },
  {
    title: "Sản phẩm",
    items: [
      { href: "/admin/tours", label: "Tour", icon: "map" },
      { href: "/admin/departures", label: "Lịch khởi hành", icon: "calendar" },
    ],
  },
  {
    title: "Đơn & điều hành",
    items: [{ href: "/admin/bookings", label: "Đơn đặt chỗ", icon: "ticket" }],
  },
  {
    title: "Yêu cầu dịch vụ",
    items: [{ href: "/admin/service-requests", label: "Yêu cầu tư vấn", icon: "mail", badge: true }],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/admin/staff", label: "Nhân viên & phân quyền", icon: "users", allowed: c => c.manageStaff },
      { href: "/admin/audit-logs", label: "Nhật ký thao tác", icon: "shield", allowed: c => c.viewAudit },
    ],
  },
];

/** The longest matching href wins, so /admin/tours/5 marks "Tour" and not "Bảng điều khiển". */
export function activeAdminHref(pathname: string): string | undefined {
  return GROUPS.flatMap(group => group.items.map(item => item.href))
    .filter(href => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

export function AdminSidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { context } = useAdmin();
  const { count } = useNewRequestCount();
  const current = activeAdminHref(usePathname());
  return (
    <nav id="admin-sidebar" className={open ? "adm-sidebar open" : "adm-sidebar"} aria-label="Quản trị">
      {GROUPS.map(group => {
        const items = group.items.filter(item => !item.allowed || item.allowed(context.capabilities));
        if (items.length === 0) return null;
        return (
          <div key={group.title} className="adm-group">
            <p className="adm-group-title">{group.title}</p>
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={onNavigate}
                aria-current={item.href === current ? "page" : undefined}>
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.badge && <NewRequestBadge count={count} />}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
