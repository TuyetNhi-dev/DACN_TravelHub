import { parseGuestCart } from "@/lib/cart-rules";
import type { GuestCartLine } from "@/types/cart";

/** localStorage key of the guest cart; the version suffix lets a future format start clean. */
export const GUEST_CART_KEY = "travelhub-guest-cart-v1";

/**
 * Browser storage can be missing or throw (private mode, blocked site data, full quota). The guest cart then
 * lives only in memory for this visit; callers learn about it through the boolean result.
 */
export function readGuestCart(): GuestCartLine[] {
  try {
    return parseGuestCart(window.localStorage.getItem(GUEST_CART_KEY));
  } catch {
    return [];
  }
}

export function writeGuestCart(lines: GuestCartLine[]): boolean {
  try {
    if (lines.length === 0) window.localStorage.removeItem(GUEST_CART_KEY);
    else window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
    return true;
  } catch {
    return false;
  }
}
