import type { AuthUser, RoleCode } from "@/types/auth";

const OPERATOR_ROLES: readonly RoleCode[] = ["STAFF", "ADMIN"];

export const ROLE_LABELS: Record<RoleCode, string> = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị viên",
};

/** UI hint only: the server enforces roles and scopes on every admin request. */
export function isOperator(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles.some(role => (OPERATOR_ROLES as readonly string[]).includes(role.code)));
}

export function roleLabel(code: string): string {
  return ROLE_LABELS[code as RoleCode] ?? code;
}

/** Only same-site relative paths are accepted as a post-login destination (no open redirect). */
export function safeReturnPath(value: string | null, fallback = "/account"): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

export function loginHref(returnPath: string): string {
  return "/login?next=" + encodeURIComponent(returnPath);
}
