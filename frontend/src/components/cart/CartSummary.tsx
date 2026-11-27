import { TrustNotes } from "@/components/ui/TrustNotes";
import { canBook } from "@/lib/cart-rules";
import { formatCurrency } from "@/lib/format";
import type { Cart } from "@/types/cart";

/**
 * "Tổng tiền": sticky beside the list on wide screens, a fixed bar at the bottom on phones. Only lines that can
 * still be booked are added up, and the figure is an estimate: each tour is priced again when it is booked.
 */
export function CartSummary({ cart }: { cart: Cart }) {
  const bookable = cart.items.filter(item => canBook(item.status)).length;
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title">Tổng tiền</h2>
      <dl className="cart-summary-details">
        <div><dt>Số món trong giỏ</dt><dd>{cart.items.length} / {cart.maxItems}</dd></div>
        <div><dt>Món còn đặt được</dt><dd>{bookable}</dd></div>
      </dl>
      <p className="cart-summary-total">
        <span>Tạm tính</span>
        <strong>{formatCurrency(cart.estimatedTotal)}</strong>
      </p>
      <p className="cart-summary-note">* Giá có thể thay đổi tùy thời điểm đặt</p>
      <p className="cart-summary-help">
        Giỏ hàng chỉ lưu lựa chọn, chưa giữ chỗ. Mỗi tour được đặt và thanh toán riêng: bấm &quot;Đặt ngay&quot; ở
        từng món để giữ chỗ 10 phút.
      </p>
      <TrustNotes compact />
    </aside>
  );
}
