"use client";

import { BookingDetailView } from "@/components/bookings/BookingDetailView";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getAdminBooking } from "@/services/admin";
import { AdminBookingActions } from "./AdminBookingActions";
import { AdminNav } from "./AdminNav";
import { OperatorGate } from "./OperatorGate";

export function AdminBookingPage({ bookingId }: { bookingId: string }) {
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Quản trị đơn", href: "/admin/bookings" }, { label: "Chi tiết đơn" }]} />
        <h1>Xử lý đơn đặt chỗ</h1>
      </div>
      <OperatorGate>
        <AdminNav current="bookings" />
        <AdminBookingDetail bookingId={bookingId} />
      </OperatorGate>
    </main>
  );
}

function AdminBookingDetail({ bookingId }: { bookingId: string }) {
  const { state, retry, replace } = useResource(`admin-booking:${bookingId}`,
    signal => getAdminBooking(bookingId, signal));
  if (state.status === "loading") return <LoadingState label="Đang tải đơn…" />;
  if (state.status === "error") {
    return <ErrorState error={state.error} onRetry={retry} backHref="/admin/bookings" backLabel="Danh sách đơn" />;
  }
  return (
    <BookingDetailView booking={state.data}
      actions={<AdminBookingActions booking={state.data} onChanged={replace} />} />
  );
}
