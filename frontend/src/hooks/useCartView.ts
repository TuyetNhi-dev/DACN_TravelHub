"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useResource, type Resource } from "@/hooks/useResource";
import { MAX_CART_ITEMS } from "@/lib/cart-rules";
import { quoteGuestCart } from "@/services/cart";
import type { Cart } from "@/types/cart";

const LOADING = { status: "loading" } as const;
const EMPTY: Resource<Cart> = { status: "ready", data: { items: [], estimatedTotal: 0, maxItems: MAX_CART_ITEMS } };
const NO_RETRY = () => undefined;

/**
 * The cart with live prices and seats. Signed in: the account cart from the provider. Guests: the lines in
 * localStorage priced by POST /api/cart/quote, asked again whenever the lines change.
 */
export function useCartView(): { state: Resource<Cart>; retry: () => void } {
  const { loading } = useAuth();
  const cart = useCart();
  const guestKey = !loading && !cart.signedIn && cart.guestLines.length > 0
    ? `cart-quote:${JSON.stringify(cart.guestLines)}`
    : null;
  const quote = useResource(guestKey, signal => quoteGuestCart(cart.guestLines, signal));

  if (loading) return { state: LOADING, retry: NO_RETRY };
  if (cart.signedIn) {
    const { account } = cart;
    const state: Resource<Cart> = account.status === "ready" ? { status: "ready", data: account.data.cart } : account;
    return { state, retry: cart.retryAccount };
  }
  if (cart.guestLines.length === 0) return { state: EMPTY, retry: NO_RETRY };
  return { state: quote.state, retry: quote.retry };
}
