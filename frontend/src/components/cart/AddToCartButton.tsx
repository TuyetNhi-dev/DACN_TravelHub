"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";
import type { CartChoice } from "@/types/cart";
import { useCart, type SeenPrices } from "./CartProvider";

export const CART_PATH = "/gio-hang";

interface AddToCartButtonProps {
  choice: CartChoice;
  prices: SeenPrices;
  /** False while the chosen head count is invalid (the form explains why). */
  disabled?: boolean;
}

/** Saves the current choice only: no seat is held and the price is not locked. */
export function AddToCartButton({ choice, prices, disabled = false }: AddToCartButtonProps) {
  const { add } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const closeToast = useCallback(() => setAdded(false), []);

  async function addToCart() {
    setBusy(true);
    setError("");
    try {
      await add(choice, prices);
      setAdded(true);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể thêm vào giỏ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-outline add-to-cart" disabled={busy || disabled}
        onClick={() => void addToCart()}>
        <Icon name="cart" size={18} />{busy ? "Đang thêm…" : "Thêm vào giỏ"}
      </button>
      {error && <p className="sh-error" role="alert">{error}</p>}
      {added && (
        <Toast message="Đã thêm vào giỏ" action={{ href: CART_PATH, label: "Xem giỏ hàng" }} onClose={closeToast} />
      )}
    </>
  );
}
