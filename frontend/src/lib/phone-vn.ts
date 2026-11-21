/**
 * Mirrors PhoneNumber.NormalizeVietnamese on the server: a Vietnamese mobile (03/05/07/08/09 + 8 digits) or
 * landline (02 + 9 digits), written with 0, 84 or +84 and optional spaces, dots or dashes. Returns "0…" digits,
 * or null when the number is not Vietnamese. The server checks again; this only gives an instant hint.
 */
export function normalizeVietnamesePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s.-]/g, "");
  const match = /^(?:0|\+84|84)([35789]\d{8}|2\d{9})$/.exec(compact);
  return match ? "0" + match[1] : null;
}

export const VIETNAMESE_PHONE_HINT = "Ví dụ 0912 345 678 hoặc 028 3812 3456";
