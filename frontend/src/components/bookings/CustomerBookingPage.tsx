"use client";

import { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { Steps } from "@/components/ui/Steps";
import { TrustNotes } from "@/components/ui/TrustNotes";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api-client";
import { holdsSeats, tourCheckoutStep } from "@/lib/booking-rules";
import { hasTicket, ticketHref } from "@/lib/check-in";
import { cancelMyBooking, getMyBooking } from "@/services/bookings";
import type { BookingDetail } from "@/types/booking";
import { BookingDetailView } from "./BookingDetailView";
import { PaymentPanel } from "./PaymentPanel";

export function CustomerBookingPage({ bookingId, justCreated }: { bookingId: string; justCreated: boolean }) {
  const { session } = useRequireSession();
  const { state, retry, replace } = useResource(session ? `booking:${bookingId}` : null,
    signal => getMyBooking(bookingId, signal));
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Đơn của tôi", href: "/bookings" }, { label: "Chi tiết đơn" }]} />
        <h1>Chi tiết đơn đặt chỗ</h1>
      </div>
      {state.status === "ready" && <CheckoutProgress booking={state.data} />}
      {justCreated && state.status === "ready" && (
        <p className="sh-success" role="status">
          Đã tạo đơn {state.data.code}. {holdsSeats(state.data)
            ? "Chỗ của bạn đang được giữ trong thời gian đếm ngược. Thanh toán để xác nhận đơn."
            : "Yêu cầu đã được gửi tới đối tác; chúng tôi sẽ báo lại khi có xác nhận."}
        </p>
      )}
      {state.status === "loading" && <LoadingState label="Đang tải đơn đặt chỗ…" />}
      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={retry} backHref="/bookings" backLabel="Đơn của tôi" />
      )}
      {state.status === "ready" && (
        <BookingDetailView booking={state.data}
          actions={(
            <>
              <PaymentPanel booking={state.data} onChanged={replace} onReload={retry} />
              {hasTicket(state.data) && (
                <Link className="btn btn-primary" href={ticketHref(state.data.id)}>Xem vé điện tử</Link>
              )}
              <CustomerActions booking={state.data} onChanged={replace} />
            </>
          )} />
      )}
    </main>
  );
}

/** Step bar plus reassurance while a held tour order is waiting for payment. */
function CheckoutProgress({ booking }: { booking: BookingDetail }) {
  const step = tourCheckoutStep(booking);
  if (step === null) return null;
  return (
    <>
      <Steps current={step} />
      {booking.canPay && <TrustNotes />}
    </>
  );
}

function CustomerActions({ booking, onChanged }: { booking: BookingDetail; onChanged: (b: BookingDetail) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      onChanged(await cancelMyBooking(booking.id));
      setConfirming(false);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể hủy đơn. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sh-form">
      {error && <p className="sh-error" role="alert">{error}</p>}
      {booking.canCancel && !confirming && (
        <button className="btn btn-outline" onClick={() => setConfirming(true)}>Hủy đơn</button>
      )}
      {confirming && (
        <div className="sh-state" role="alertdialog" aria-labelledby="cancel-title">
          <h3 id="cancel-title">Xác nhận hủy đơn {booking.code}?</h3>
          <p>
            {holdsSeats(booking)
              ? "Chỗ đã giữ sẽ được trả lại cho khách khác."
              : "Yêu cầu gửi đối tác sẽ được rút lại."}
          </p>
          <div className="sh-state-actions">
            <button className="btn btn-primary" onClick={() => void cancel()} disabled={busy}>
              {busy ? "Đang hủy…" : "Đồng ý hủy"}
            </button>
            <button className="btn btn-outline" onClick={() => setConfirming(false)} disabled={busy}>Giữ đơn</button>
          </div>
        </div>
      )}
      <Link className="btn btn-ghost" href="/bookings">Về danh sách đơn</Link>
    </div>
  );
}
