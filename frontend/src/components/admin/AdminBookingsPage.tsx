"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useResource } from "@/hooks/useResource";
import { getAdminLookups } from "@/services/admin-catalog";
import { ITEM_STATUS_OPTIONS, SERVICE_LABELS } from "@/lib/booking-rules";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getAdminBookings, type AdminBookingFilter } from "@/services/admin";
import type { BookingItemStatus, BookingSummary, ServiceType } from "@/types/booking";
import { useAdmin } from "./shell/AdminProvider";
import type { BranchLookup } from "@/types/admin";

const DEFAULT_FILTER: AdminBookingFilter = {
  status: "", serviceType: "", from: "", to: "", branchId: "", q: "",
};

/** Rendered inside app/admin/layout.tsx, which already checks the operator role and loads the scope. */
export function AdminBookingsPage() {
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <span className="kicker">QUẢN TRỊ · ĐIỀU HÀNH ĐƠN</span>
        <h1>Đơn đặt chỗ</h1>
        <p>Xác nhận giữ chỗ tour và phản hồi của đối tác khách sạn, vé máy bay trong phạm vi bạn phụ trách.</p>
      </div>
      <BookingQueue />
    </main>
  );
}

function BookingQueue() {
  const { scope } = useAdmin();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<AdminBookingFilter>(() => readBookingFilter(searchParams.toString()));
  const [searchText, setSearchText] = useState(filter.q);
  const { state, retry } = useResource(`admin:${scope}:${JSON.stringify(filter)}`,
    signal => getAdminBookings(filter, scope, signal));
  const lookups = useResource("admin:lookups", getAdminLookups);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilter(current => ({ ...current, q: searchText.trim() }));
  }

  const update = (patch: Partial<AdminBookingFilter>) =>
    setFilter(current => ({ ...current, ...patch }));
  return <>
      <BookingFilters filter={filter} searchText={searchText}
        branches={lookups.state.status === "ready" ? lookups.state.data.branches : []}
        onChange={update} onSearch={search} onSearchText={setSearchText} onRefresh={retry} />
      {state.status === "loading" && <LoadingState label="Đang tải đơn…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.length === 0 && <EmptyState title="Không có đơn phù hợp bộ lọc" />}
      {state.status === "ready" && state.data.length > 0 && <BookingTable bookings={state.data} />}
    </>;
}

function readBookingFilter(search: string): AdminBookingFilter {
  const params = new URLSearchParams(search);
  const status = params.get("status") ?? "";
  const serviceType = params.get("serviceType") ?? "";
  return {
    ...DEFAULT_FILTER,
    status: ITEM_STATUS_OPTIONS.some(item => item.value === status) ? status as BookingItemStatus : "",
    serviceType: Object.hasOwn(SERVICE_LABELS, serviceType) ? serviceType as ServiceType : "",
    from: params.get("from") ?? "", to: params.get("to") ?? "", branchId: params.get("branchId") ?? "",
    q: params.get("q") ?? "",
  };
}

function BookingFilters({ filter, searchText, branches, onChange, onSearch, onSearchText, onRefresh }: {
  filter: AdminBookingFilter; searchText: string; branches: BranchLookup[];
  onChange: (patch: Partial<AdminBookingFilter>) => void; onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSearchText: (value: string) => void; onRefresh: () => void;
}) {
  return <form className="sh-toolbar adm-booking-filters" role="search" aria-label="Lọc đơn" onSubmit={onSearch}>
    <label className="sh-field">Tìm theo mã, tên, số điện thoại hoặc email
      <input type="search" maxLength={100} value={searchText}
        onChange={event => onSearchText(event.target.value)} />
    </label>
    <BookingSelectFilters filter={filter} onChange={onChange} />
    <BookingDateFilters filter={filter} branches={branches} onChange={onChange} />
    <button className="btn btn-outline" type="button" onClick={onRefresh}>Làm mới</button>
    <button className="btn btn-primary" type="submit">Tìm kiếm</button>
  </form>;
}

function BookingSelectFilters({ filter, onChange }: {
  filter: AdminBookingFilter; onChange: (patch: Partial<AdminBookingFilter>) => void;
}) {
  return <>
    <label className="sh-field">Trạng thái<select value={filter.status} onChange={event =>
      onChange({ status: event.target.value as BookingItemStatus | "" })}>
      <option value="">Tất cả</option>{ITEM_STATUS_OPTIONS.map(option =>
        <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    <label className="sh-field">Dịch vụ<select value={filter.serviceType} onChange={event =>
      onChange({ serviceType: event.target.value as ServiceType | "" })}>
      <option value="">Tất cả</option>{Object.entries(SERVICE_LABELS).map(([value, label]) =>
        <option key={value} value={value}>{label}</option>)}
    </select></label>
  </>;
}

function BookingDateFilters({ filter, branches, onChange }: {
  filter: AdminBookingFilter; branches: BranchLookup[]; onChange: (patch: Partial<AdminBookingFilter>) => void;
}) {
  return <>
    <label className="sh-field">Từ ngày<input type="date" value={filter.from}
      onChange={event => onChange({ from: event.target.value })} /></label>
    <label className="sh-field">Đến ngày<input type="date" value={filter.to}
      onChange={event => onChange({ to: event.target.value })} /></label>
    {branches.length > 0 && <label className="sh-field">Chi nhánh<select value={filter.branchId}
      onChange={event => onChange({ branchId: event.target.value })}>
      <option value="">Tất cả trong phạm vi</option>{branches.map(branch =>
        <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select></label>}
  </>;
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
