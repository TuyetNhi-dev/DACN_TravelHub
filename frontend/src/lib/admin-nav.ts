/**
 * Back-office menu and breadcrumb. Items are hidden when the operator's capabilities do not allow them (the API
 * refuses the same pages anyway), and only pages that exist under app/admin are linked.
 */
import type { IconName } from "@/components/ui/Icon";
import type { AdminCapabilities } from "@/types/admin";

export const ADMIN_ROOT = "/admin";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: IconName;
  allowed?: (capabilities: AdminCapabilities) => boolean;
  /** Shows the "new service requests" count. */
  badge?: boolean;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "Tổng quan", items: [{ href: ADMIN_ROOT, label: "Dashboard", icon: "grid" }] },
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
    title: "Khách hàng",
    items: [{ href: "/admin/service-requests", label: "Yêu cầu dịch vụ", icon: "mail", badge: true }],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/admin/staff", label: "Nhân viên & phân quyền", icon: "users", allowed: c => c.manageStaff },
      { href: "/admin/audit-logs", label: "Nhật ký thao tác", icon: "history", allowed: c => c.viewAudit },
    ],
  },
];

/** Groups with only the items this operator may open; empty groups are dropped. */
export function visibleNav(capabilities: AdminCapabilities): AdminNavGroup[] {
  return ADMIN_NAV.map(group => ({
    ...group, items: group.items.filter(item => !item.allowed || item.allowed(capabilities)),
  })).filter(group => group.items.length > 0);
}

/** The longest matching href wins, so /admin/tours/5 marks "Tour" and only /admin itself marks "Dashboard". */
export function activeAdminHref(pathname: string): string | undefined {
  return ADMIN_NAV.flatMap(group => group.items.map(item => item.href))
    .filter(href => pathname === href || (href !== ADMIN_ROOT && pathname.startsWith(href + "/")))
    .sort((a, b) => b.length - a.length)[0];
}

export interface Crumb {
  label: string;
  href?: string;
}

// Detail pages under a section: /admin/tours/new, /admin/tours/5, /admin/departures/5/manifest…
const DETAIL_LABELS: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/admin\/tours\/new$/, label: "Thêm tour" },
  { pattern: /^\/admin\/tours\/[^/]+$/, label: "Sửa tour" },
  { pattern: /^\/admin\/departures\/[^/]+\/manifest$/, label: "Danh sách đoàn" },
  { pattern: /^\/admin\/bookings\/[^/]+$/, label: "Chi tiết đơn" },
  { pattern: /^\/admin\/service-requests\/[^/]+$/, label: "Chi tiết yêu cầu" },
];

/** "Quản trị › Tour › Sửa tour": the section links back to its list, the current page is plain text. */
export function adminBreadcrumb(pathname: string): Crumb[] {
  const path = pathname.replace(/\/+$/, "") || ADMIN_ROOT;
  const root: Crumb = { label: "Quản trị", href: ADMIN_ROOT };
  if (path === ADMIN_ROOT) return [{ label: "Quản trị" }, { label: "Dashboard" }];
  const active = activeAdminHref(path);
  const section = ADMIN_NAV.flatMap(group => group.items).find(item => item.href === active);
  if (!section) return [root];
  const detail = DETAIL_LABELS.find(entry => entry.pattern.test(path));
  return detail ? [root, { label: section.label, href: section.href }, { label: detail.label }]
    : [root, { label: section.label }];
}
