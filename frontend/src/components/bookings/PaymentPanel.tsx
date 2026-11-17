"use client";

import { useRef, useState } from "react";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { HOLD_EXPIRED, payBooking } from "@/services/bookings";
import type { BookingDetail } from "@/types/booking";

interface PaymentPanelProps {
  booking: BookingDetail;
  onChanged: (booking: BookingDetail) => void;
  /** Reloads the order from the server, e.g. after its hold ran out. */
  onReload: () => void;
}

/** Simulated payment until the VNPAY sandbox is integrated. No card data is asked for or stored. */
export function PaymentPanel({ booking, onChanged, onReload }: PaymentPanelProps) {
  const left = useCountdown(booking.canPay ? booking.holdExpiresAt : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // One key per payment attempt: a retry after a network error reuses it, so the order is never paid twice.
  const attemptKey = useRef<string | null>(null);

  if (booking.paidAt) {
    return <p className="sh-success" role="status">Đã thanh toán lúc {formatDateTime(booking.paidAt)}.</p>;
  }
  if (!booking.canPay) return null;
  const expired = left === 0;

  async function pay() {
    attemptKey.current ??= crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      onChanged(await payBooking(booking.id, attemptKey.current));
      attemptKey.current = null;
    } catch (failure) {
      if (failure instanceof ApiError && failure.status !== undefined) attemptKey.current = null;
      if (failure instanceof ApiError && failure.code === HOLD_EXPIRED) onReload();
      setError(failure instanceof ApiError ? failure.message : "Không thể thanh toán. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="payment-panel" aria-labelledby="payment-title">
      <h2 id="payment-title">Thanh toán</h2>
      {left !== null && (
        <p className={expired ? "payment-timer is-expired" : "payment-timer"} role="timer" aria-live="off">
          {expired ? "Đã hết thời gian giữ chỗ." : <>Giữ chỗ còn <strong>{formatCountdown(left)}</strong></>}
        </p>
      )}
      <p className="payment-total">Số tiền: <strong>{formatCurrency(booking.total)}</strong></p>
      {error && <p className="sh-error" role="alert">{error}</p>}
      {expired
        ? <button type="button" className="btn btn-outline" onClick={onReload}>Tải lại đơn</button>
        : (
          <button type="button" className="btn btn-primary" onClick={() => void pay()} disabled={busy}>
            {busy ? "Đang thanh toán…" : "Thanh toán (mô phỏng)"}
          </button>
        )}
      <p className="sh-hotel-caption">
        Thanh toán mô phỏng cho đồ án: không trừ tiền thật và không cần thông tin thẻ.
      </p>
    </section>
  );
}
