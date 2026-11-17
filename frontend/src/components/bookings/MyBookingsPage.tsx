"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useResource } from "@/hooks/useResource";
import { getMyBookings } from "@/services/bookings";
import { BookingListItem } from "./BookingListItem";

export function MyBookingsPage() {
  const { session } = useRequireSession();
  const { state, retry } = useResource(session ? `my-bookings:${session.user.id}` : null, getMyBookings);
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Tài khoản", href: "/account" }, { label: "Đơn của tôi" }]} />
        <h1>Đơn của tôi</h1>
        <p>Theo dõi trạng thái giữ chỗ tour và các yêu cầu khách sạn, vé máy bay đang chờ đối tác xác nhận.</p>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tải đơn đặt chỗ…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title="Bạn chưa có đơn nào">
          <p>Bắt đầu hành trình với tour trọn gói, khách sạn hoặc vé máy bay.</p>
          <div className="sh-state-actions">
            <Link className="btn btn-primary" href="/tours">Xem tour</Link>
            <Link className="btn btn-outline" href="/hotels">Tìm khách sạn</Link>
            <Link className="btn btn-outline" href="/flights">Tìm vé máy bay</Link>
          </div>
        </EmptyState>
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <ul className="sh-booking-list">
          {state.data.map(booking => (
            <BookingListItem key={booking.id} booking={booking} href={`/bookings/${encodeURIComponent(booking.id)}`} />
          ))}
        </ul>
      )}
    </main>
  );
}
