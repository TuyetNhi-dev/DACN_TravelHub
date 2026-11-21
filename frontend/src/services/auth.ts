import { ApiError, apiGet, apiPost } from "@/lib/api-client";
import { bool, invalid, isRecord, list, optStr, str, type Row } from "@/lib/decode";
import type {
  AuthUser, LoginInput, PasswordResetInput, RegisterInput, RegisterResult, RoleAssignment, Session,
} from "@/types/auth";

const RESOURCE = "tài khoản";
const UNAUTHORIZED = 401;

function decodeRole(row: Row): RoleAssignment {
  return {
    code: str(row, "code", RESOURCE), scope: str(row, "scope", RESOURCE),
    regionId: optStr(row, "regionId", RESOURCE), branchId: optStr(row, "branchId", RESOURCE),
  };
}

function decodeUser(value: unknown): AuthUser {
  if (!isRecord(value)) return invalid(RESOURCE);
  return {
    id: str(value, "id", RESOURCE), fullName: str(value, "fullName", RESOURCE),
    email: str(value, "email", RESOURCE), phone: optStr(value, "phone", RESOURCE),
    roles: list(value.roles, decodeRole, RESOURCE),
  };
}

function decodeSession(value: unknown): Session {
  if (!isRecord(value)) return invalid(RESOURCE);
  return {
    user: decodeUser(value.user), expiresAt: optStr(value, "expiresAt", RESOURCE),
    termsAccepted: bool(value, "termsAccepted", RESOURCE),
  };
}

/** Returns null when nobody is signed in instead of treating it as an error. */
export async function getSession(signal?: AbortSignal): Promise<Session | null> {
  try {
    return decodeSession(await apiGet("/api/auth/me", signal));
  } catch (error) {
    if (error instanceof ApiError && error.status === UNAUTHORIZED) return null;
    throw error;
  }
}

export async function login(input: LoginInput): Promise<Session> {
  return decodeSession(await apiPost("/api/auth/login", input));
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const value = await apiPost("/api/auth/register", input);
  if (!isRecord(value) || typeof value.emailSent !== "boolean") return invalid(RESOURCE);
  return { message: str(value, "message", RESOURCE), emailSent: value.emailSent };
}

/** A correct code activates the account and signs the user in. */
export async function verifyEmail(email: string, code: string): Promise<Session> {
  return decodeSession(await apiPost("/api/auth/verify-email", { email, code }));
}

/** Exchanges the Google ID token from Google Identity Services for a SàiHành session. */
export async function signInWithGoogle(credential: string): Promise<Session> {
  return decodeSession(await apiPost("/api/auth/google", { credential }));
}

/** The public OAuth Client ID, or null when Google sign-in is not configured on the server. */
export async function getGoogleClientId(signal?: AbortSignal): Promise<string | null> {
  const value = await apiGet("/api/auth/google/config", signal);
  return isRecord(value) ? optStr(value, "clientId", RESOURCE) : invalid(RESOURCE);
}

/** Always succeeds for a well-formed email, whether or not it is registered (no account enumeration). */
export async function resendVerification(email: string): Promise<string> {
  return readMessage(await apiPost("/api/auth/resend-verification", { email }));
}

function readMessage(value: unknown): string {
  return isRecord(value) ? str(value, "message", RESOURCE) : invalid(RESOURCE);
}

/** "Hoàn tất đăng ký": stores the agreement; the refreshed session has termsAccepted = true. */
export async function acceptTerms(): Promise<Session> {
  return decodeSession(await apiPost("/api/auth/accept-terms", { accept: true }));
}

/** Always answers the same message, whether or not the email is registered. */
export async function requestPasswordReset(email: string): Promise<string> {
  return readMessage(await apiPost("/api/auth/password-reset/request", { email }));
}

/** A correct code sets the new password and ends every other session of the account. */
export async function confirmPasswordReset(input: PasswordResetInput): Promise<string> {
  return readMessage(await apiPost("/api/auth/password-reset/confirm", input));
}

/** Saves the contact phone on the account; every later booking uses it without asking again. */
export async function updatePhone(phone: string): Promise<AuthUser> {
  return decodeUser(await apiPost("/api/account/phone", { phone }));
}

export async function logout(): Promise<void> {
  await apiPost("/api/auth/logout");
}
