/** Mirrors TravelHub.Api.Features.Auth DTOs. */
/** Customers (scope self); staff and branch managers (branch, region or global); admins (global). */
export type RoleCode = "CUSTOMER" | "STAFF" | "BRANCH_MANAGER" | "ADMIN";

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
  /** False until the user ticks the data protection policy and terms of use ("Hoàn tất đăng ký"). */
  termsAccepted: boolean;
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
/** API answer for any signed-in feature while the account has not agreed to the terms yet. */
export const TERMS_REQUIRED = "terms_required";

export interface RegisterInput extends LoginInput {
  fullName: string;
  confirmPassword: string;
  acceptTerms: boolean;
  /** Optional Vietnamese number; the server stores it as the booking contact. */
  phone: string | null;
}

export interface PasswordResetInput {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}
