import type { AuthUser, RoleCode } from "@/types/auth";

const OPERATOR_ROLES: readonly RoleCode[] = ["STAFF", "BRANCH_MANAGER", "ADMIN"];

export const ROLE_LABELS: Record<RoleCode, string> = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  ADMIN: "Quản trị viên",
};

/** UI hint only: the server enforces roles and scopes on every admin request. */
export function isOperator(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles.some(role => (OPERATOR_ROLES as readonly string[]).includes(role.code)));
}

export function roleLabel(code: string): string {
  return ROLE_LABELS[code as RoleCode] ?? code;
}

/** First page of the back office; `/admin` itself redirects here. */
export const ADMIN_HOME_PATH = "/admin/bookings";
const HOME_PATH = "/";
const NO_SAFE_PATH = "";

/** Only same-site relative paths are accepted as a post-login destination (no open redirect). */
export function safeReturnPath(value: string | null, fallback = "/account"): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

/**
 * Where to go after signing in. A specific page the visitor came from wins (e.g. checkout); otherwise staff
 * and admins start in the back office, and customers keep the usual destination.
 */
export function postLoginPath(next: string | null, user: AuthUser | null | undefined): string {
  const safeNext = safeReturnPath(next, NO_SAFE_PATH);
  const cameFromPage = safeNext !== NO_SAFE_PATH && safeNext !== HOME_PATH;
  if (!cameFromPage && isOperator(user)) return ADMIN_HOME_PATH;
  return safeReturnPath(next);
}

export function loginHref(returnPath: string): string {
  return "/login?next=" + encodeURIComponent(returnPath);
}

/** Avatar letters: first and last word ("Nguyễn Văn An" → "NA"), or the first two letters of a single word. */
export function nameInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return letters.toLocaleUpperCase("vi");
}

export interface AccountLink {
  href: string;
  label: string;
  /** The "Yêu cầu dịch vụ" entry shows how many requests nobody has contacted yet. */
  showsNewRequests?: boolean;
}

/** Account menu entries; staff and admins also get the back-office queues (the server still checks roles). */
export function accountLinks(user: AuthUser): AccountLink[] {
  const links: AccountLink[] = [
    { href: "/account", label: "Tài khoản của tôi" },
    { href: "/bookings", label: "Đơn của tôi" },
  ];
  if (!isOperator(user)) return links;
  return [
    ...links,
    { href: "/admin/bookings", label: "Quản trị đơn" },
    { href: "/admin/service-requests", label: "Yêu cầu dịch vụ", showsNewRequests: true },
  ];
}
