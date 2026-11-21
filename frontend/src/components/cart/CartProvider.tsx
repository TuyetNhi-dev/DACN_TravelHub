"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useResource, type Resource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api-client";
import { addGuestLine, guestLine, removeGuestLine } from "@/lib/cart-rules";
import { readGuestCart, writeGuestCart } from "@/lib/guest-cart";
import { deleteCartItem, getCart, mergeGuestCart, saveCartItem } from "@/services/cart";
import type { CartChoice, CartItem, GuestCartLine, MergedCart } from "@/types/cart";

const STORAGE_BLOCKED =
  "Trình duyệt đang chặn lưu dữ liệu nên không giữ được giỏ hàng. Vui lòng đăng nhập để lưu giỏ.";
const CONFLICT = 409;

/** Prices on the page when the line was added: only used to warn later if they changed. */
export interface SeenPrices {
  adult: number;
  child: number | null;
}

interface CartContextValue {
  /** Number of lines, for the header badge. */
  count: number;
  signedIn: boolean;
  guestLines: GuestCartLine[];
  /** The account cart (signed in only); `notMoved` is set once after a sign-in merge. */
  account: Resource<MergedCart>;
  retryAccount: () => void;
  dismissMergeNotice: () => void;
  add: (choice: CartChoice, prices: SeenPrices) => Promise<void>;
  remove: (item: Pick<CartItem, "id" | "departureId">) => Promise<void>;
  /** After a booking: the matching line leaves the cart. */
  removeDeparture: (departureId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Signed in: the cart lives in the database. Guests: localStorage, merged into the account at sign-in. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  // Until the user agrees to the terms, the API refuses the account cart (403): treat them like a guest meanwhile.
  const userId = loading || !session?.termsAccepted ? null : session.user.id;
  const guest = useGuestCart();
  const { state: account, retry: retryAccount, replace } = useResource<MergedCart>(
    userId ? `cart:${userId}` : null, loadAccountCart);
  const accountCart = account.status === "ready" ? account.data.cart : null;

  const add = useCallback(async (choice: CartChoice, prices: SeenPrices) => {
    if (userId) return replace({ cart: await saveCartItem(choice), notMoved: 0 });
    const result = addGuestLine(guest.lines, guestLine(choice, prices.adult, prices.child, new Date()));
    if ("error" in result) throw new ApiError(result.error, CONFLICT);
    if (!guest.save(result.lines)) throw new ApiError(STORAGE_BLOCKED);
  }, [userId, guest, replace]);

  const remove = useCallback(async (item: Pick<CartItem, "id" | "departureId">) => {
    if (userId && item.id) return replace({ cart: await deleteCartItem(item.id), notMoved: 0 });
    guest.save(removeGuestLine(guest.lines, item.departureId));
  }, [userId, guest, replace]);

  const removeDeparture = useCallback(async (departureId: string) => {
    const item = accountCart?.items.find(line => line.departureId === departureId);
    try {
      if (userId) { if (item) await remove(item); }
      else await remove({ id: null, departureId });
    } catch {
      // The booking itself succeeded; a line left in the cart is harmless and the customer can delete it.
    }
  }, [userId, accountCart, remove]);

  const dismissMergeNotice = useCallback(() => {
    if (accountCart) replace({ cart: accountCart, notMoved: 0 });
  }, [accountCart, replace]);

  const value: CartContextValue = {
    count: userId ? accountCart?.items.length ?? 0 : guest.lines.length,
    signedIn: userId !== null, guestLines: guest.lines, account, retryAccount, dismissMergeNotice,
    add, remove, removeDeparture,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Right after sign-in the guest cart is merged first, then cleared from the browser. If the merge fails the
 * guest lines stay in localStorage and are merged on the next load.
 */
async function loadAccountCart(signal: AbortSignal): Promise<MergedCart> {
  const lines = readGuestCart();
  if (lines.length === 0) return { cart: await getCart(signal), notMoved: 0 };
  const merged = await mergeGuestCart(lines);
  writeGuestCart([]);
  return merged;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
