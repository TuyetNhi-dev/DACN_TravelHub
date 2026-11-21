/** Same limits as the backend PasswordRules (sign-up and password reset). */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordLevel = "empty" | "too-short" | "ok" | "strong";

export interface PasswordCheck {
  level: PasswordLevel;
  /** The two hard rules the server enforces. */
  lengthOk: boolean;
  matches: boolean;
  /** Soft advice only: the server does not require these, so they never block the form. */
  tips: string[];
}

const STRONG_LENGTH = 16;

/**
 * Strength hint for the password fields. Only length (12–128) and the confirmation are required, exactly as on
 * the server; mixing letter case, digits and symbols, or a longer passphrase, is suggested, never enforced.
 */
export function checkPassword(password: string, confirmation: string): PasswordCheck {
  const lengthOk = password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const kinds = [/[a-zà-ỹ]/, /[A-ZÀ-Ỹ]/, /\d/, /[^\p{L}\d]/u].filter(pattern => pattern.test(password)).length;
  const tips = [
    ...(kinds < 3 ? ["Kết hợp chữ hoa, chữ thường, số hoặc ký tự đặc biệt."] : []),
    ...(password.length < STRONG_LENGTH ? [`Mật khẩu từ ${STRONG_LENGTH} ký tự trở lên sẽ an toàn hơn.`] : []),
  ];
  const level: PasswordLevel = password.length === 0 ? "empty"
    : !lengthOk ? "too-short"
    : kinds >= 3 && password.length >= STRONG_LENGTH ? "strong" : "ok";
  return { level, lengthOk, matches: confirmation.length > 0 && password === confirmation, tips };
}
