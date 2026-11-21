"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseGuestCart } from "@/lib/cart-rules";
import { GUEST_CART_KEY, writeGuestCart } from "@/lib/guest-cart";
import type { GuestCartLine } from "@/types/cart";

/** Same-tab writes do not fire "storage" (that event only reaches OTHER tabs), so we announce them ourselves. */
const CHANGE_EVENT = "travelhub-guest-cart-change";

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === GUEST_CART_KEY) notify(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

/** The raw string is the snapshot: equal strings mean no re-render, and parsing happens once per change. */
function rawSnapshot(): string {
  try {
    return window.localStorage.getItem(GUEST_CART_KEY) ?? "";
  } catch {
    // Storage blocked: the guest cart is empty (adding then reports that it cannot be saved).
    return "";
  }
}

/** Guest cart lines in localStorage, kept in sync across tabs. `save` returns false when storage is blocked. */
export function useGuestCart() {
  const raw = useSyncExternalStore(subscribe, rawSnapshot, () => "");
  const lines = useMemo(() => parseGuestCart(raw), [raw]);
  const save = useCallback((next: GuestCartLine[]) => {
    const saved = writeGuestCart(next);
    if (saved) window.dispatchEvent(new Event(CHANGE_EVENT));
    return saved;
  }, []);
  return { lines, save };
}
