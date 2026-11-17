import type { AuthUser, RoleCode } from "@/types/auth";

const OPERATOR_ROLES: readonly RoleCode[] = ["SUPER_ADMIN", "REGIONAL_MANAGER", "BRANCH_MANAGER", "STAFF"];

export const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: "Quản trị hệ thống",
  REGIONAL_MANAGER: "Quản lý khu vực",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  STAFF: "Nhân viên điều hành",
  CUSTOMER: "Khách hàng",
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
