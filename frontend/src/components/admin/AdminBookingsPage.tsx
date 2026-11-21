"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useResource } from "@/hooks/useResource";
import { ITEM_STATUS_OPTIONS, SERVICE_LABELS } from "@/lib/booking-rules";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getAdminBookings, type AdminBookingFilter } from "@/services/admin";
import type { BookingItemStatus, BookingSummary, ServiceType } from "@/types/booking";
import { AdminNav } from "./AdminNav";
import { OperatorGate } from "./OperatorGate";

const DEFAULT_FILTER: AdminBookingFilter = { status: "", serviceType: "" };

export function AdminBookingsPage() {
  return (
    <main id="main-content" className="container sh-page">
      <div className="sh-page-head">
        <span className="kicker">QUẢN TRỊ · ĐIỀU HÀNH ĐƠN</span>
        <h1>Đơn đặt chỗ</h1>
        <p>Xác nhận giữ chỗ tour và phản hồi của đối tác khách sạn, vé máy bay trong phạm vi bạn phụ trách.</p>
      </div>
      <OperatorGate>
        <AdminNav current="bookings" />
        <BookingQueue />
      </OperatorGate>
    </main>
  );
}

function BookingQueue() {
  const [filter, setFilter] = useState<AdminBookingFilter>(DEFAULT_FILTER);
  const { state, retry } = useResource(`admin:${JSON.stringify(filter)}`,
    signal => getAdminBookings(filter, signal));
  return (
    <>
      <div className="sh-toolbar" role="search" aria-label="Lọc đơn">
        <label className="sh-field">
          Trạng thái
          <select value={filter.status}
            onChange={event => setFilter({ ...filter, status: event.target.value as BookingItemStatus | "" })}>
            <option value="">Tất cả</option>
            {ITEM_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="sh-field">
          Dịch vụ
          <select value={filter.serviceType}
            onChange={event => setFilter({ ...filter, serviceType: event.target.value as ServiceType | "" })}>
            <option value="">Tất cả</option>
            {Object.entries(SERVICE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="btn btn-outline" onClick={retry}>Làm mới</button>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tải đơn…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.length === 0 && <EmptyState title="Không có đơn phù hợp bộ lọc" />}
      {state.status === "ready" && state.data.length > 0 && <BookingTable bookings={state.data} />}
    </>
  );
}

// Header cells and the phone card labels (td[data-label]) share these names.
const BOOKING_COLUMNS = ["Mã đơn", "Dịch vụ", "Khách hàng", "Ngày sử dụng", "Tổng", "Trạng thái"] as const;
const [CODE, SERVICE, CUSTOMER, START_DATE, TOTAL, STATUS] = BOOKING_COLUMNS;

function BookingTable({ bookings }: { bookings: BookingSummary[] }) {
  return (
    <div className="sh-table-wrap">
      <table className="sh-table sh-table--cards">
        <caption className="sr-only">Danh sách đơn đặt chỗ</caption>
        <thead>
          <tr>{BOOKING_COLUMNS.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {bookings.map(booking => (
            <tr key={booking.id}>
              <td data-label={CODE}>
                <Link href={`/admin/bookings/${encodeURIComponent(booking.id)}`}>{booking.code}</Link>
                <small>{formatDateTime(booking.createdAt)}</small>
              </td>
              <td data-label={SERVICE}>{booking.title}<small>{SERVICE_LABELS[booking.serviceType]}</small></td>
              <td data-label={CUSTOMER}>
                {booking.customer?.fullName ?? "—"}
                <small>{booking.customer?.phone ?? booking.customer?.email}</small>
              </td>
              <td data-label={START_DATE}>{formatDate(booking.startDate)}</td>
              <td data-label={TOTAL}>{formatCurrency(booking.total)}</td>
              <td data-label={STATUS}><StatusBadge status={booking.itemStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
