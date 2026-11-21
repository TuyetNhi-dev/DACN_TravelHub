"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CART_PATH } from "./AddToCartButton";
import { useCart } from "./CartProvider";

/** Header icon with the number of cart lines. Fixed 44px wide, so it never changes the header's width. */
export function CartButton({ pathname }: { pathname: string }) {
  const { count } = useCart();
  return (
    <Link href={CART_PATH} className="cart-button" aria-current={pathname === CART_PATH ? "page" : undefined}
      aria-label={count > 0 ? `Giỏ hàng, ${count} món` : "Giỏ hàng, chưa có món nào"}>
      <Icon name="cart" size={22} />
      {count > 0 && <span className="cart-button-count" aria-hidden="true">{count}</span>}
    </Link>
  );
}
