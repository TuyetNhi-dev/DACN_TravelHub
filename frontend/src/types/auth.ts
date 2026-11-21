/** Mirrors TravelHub.Api.Features.Auth DTOs. */
/** Three roles: customers (scope self), staff and admins (scope global). */
export type RoleCode = "CUSTOMER" | "STAFF" | "ADMIN";

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

/** Same rule as the backend PhoneNumber: 9–15 digits, optional leading +. */
export const PHONE_PATTERN = "\\+?[0-9]{9,15}";
export const PHONE_HINT = "9–15 chữ số, có thể bắt đầu bằng +";

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
