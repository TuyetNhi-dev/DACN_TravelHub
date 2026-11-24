"use client";

import { useCallback } from "react";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { Steps } from "@/components/ui/Steps";
import { Toast } from "@/components/ui/Toast";
import { useCartView } from "@/hooks/useCartView";
import { CartEmpty } from "./CartEmpty";
import { CartItemCard } from "./CartItemCard";
import { useCart } from "./CartProvider";
import { CartSummary } from "./CartSummary";

export function CartPage() {
  const { state, retry } = useCartView();
  return (
    <main id="main-content" className="container sh-page cart-page">
      <header className="sh-page-head">
        <span className="kicker">GIỎ HÀNG</span>
        <h1>Giỏ hàng của bạn</h1>
        <p>Các tour bạn đã lưu. Giá và số chỗ dưới đây là thông tin hiện tại của từng lịch khởi hành.</p>
      </header>
      <Steps current={0} />
      <MergeNotice />
      {state.status === "loading" && <LoadingState label="Đang tải giỏ hàng…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.items.length === 0 && <CartEmpty />}
      {state.status === "ready" && state.data.items.length > 0 && (
        <div className="cart-layout">
          <ul className="cart-list" aria-label="Các món trong giỏ">
            {state.data.items.map(item => <CartItemCard key={item.departureId} item={item} />)}
          </ul>
          <CartSummary cart={state.data} />
        </div>
      )}
    </main>
  );
}

/** After sign-in, tells how many guest lines could not be moved into the account cart. */
function MergeNotice() {
  const { account, dismissMergeNotice } = useCart();
  const close = useCallback(() => dismissMergeNotice(), [dismissMergeNotice]);
  const notMoved = account.status === "ready" ? account.data.notMoved : 0;
  if (notMoved === 0) return null;
  const message = `${notMoved} món trong giỏ trước khi đăng nhập không chuyển được `
    + "(hết chỗ, ngừng bán hoặc giỏ đã đủ).";
  return <Toast onClose={close} message={message} />;
}
