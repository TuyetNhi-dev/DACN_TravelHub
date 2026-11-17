/** Mirrors TravelHub.Api.Features.Auth DTOs. */
export type RoleCode = "SUPER_ADMIN" | "REGIONAL_MANAGER" | "BRANCH_MANAGER" | "STAFF" | "CUSTOMER";

export interface RoleAssignment {
  code: string;
  scope: string;
  regionId: string | null;
  branchId: string | null;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: RoleAssignment[];
}

export interface Session {
  user: AuthUser;
  expiresAt: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Mirrors RegisterResponse: the account exists even when emailSent is false. */
export interface RegisterResult {
  message: string;
  emailSent: boolean;
}

export const EMAIL_NOT_VERIFIED = "email_not_verified";
export const PHONE_REQUIRED = "phone_required";

/** Same rule as the backend PhoneNumber: 9–15 digits, optional leading +. */
export const PHONE_PATTERN = "\\+?[0-9]{9,15}";
export const PHONE_HINT = "9–15 chữ số, có thể bắt đầu bằng +";

export interface RegisterInput extends LoginInput {
  fullName: string;
  confirmPassword: string;
  acceptTerms: boolean;
}
