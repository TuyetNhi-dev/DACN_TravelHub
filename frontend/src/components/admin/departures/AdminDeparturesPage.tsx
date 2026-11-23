"use client";

import Link from "next/link";
import { useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { DEPARTURES_HREF, departurePageCount } from "@/lib/admin-departures";
import { DEPARTURE_STATUS } from "@/lib/admin-labels";
import { getAdminDepartures, getAdminLookups, type DepartureFilter } from "@/services/admin-catalog";
import type { AdminDeparture, DepartureStatus } from "@/types/admin";
import { useAdmin } from "../shell/AdminProvider";
import { DepartureEditPanel } from "./DepartureEditPanel";
import { DepartureTable } from "./DepartureTable";

const STATUS_FILTERS = Object.entries(DEPARTURE_STATUS) as [DepartureStatus, { label: string }][];

/** `initialTourId` comes from ?tourId= (the "xem các lịch của tour" link on the tour editor). */
export function AdminDeparturesPage({ initialTourId }: { initialTourId: string }) {
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <span className="kicker">QUẢN TRỊ · SẢN PHẨM</span>
        <h1>Lịch khởi hành</h1>
        <p>Lịch do các chi nhánh trong phạm vi đang chọn điều hành. Thêm lịch mới trong trang sửa tour.</p>
      </div>
      <DepartureQueue initialTourId={initialTourId} />
    </main>
  );
}

function DepartureQueue({ initialTourId }: { initialTourId: string }) {
  const { scope } = useAdmin();
  const [filter, setFilter] = useState<DepartureFilter>(
    { tourId: initialTourId, from: "", to: "", status: "", page: 1 });
  const [editing, setEditing] = useState<AdminDeparture | null>(null);
  const list = useResource(`admin-departures:${scope}:${JSON.stringify(filter)}`,
    signal => getAdminDepartures(filter, scope, signal));
  const lookups = useResource("admin:lookups", getAdminLookups);
  const change = (patch: Partial<DepartureFilter>) => setFilter(current => ({ ...current, ...patch, page: 1 }));
  const saved = (next: AdminDeparture) => {
    if (list.state.status === "ready") {
      const items = list.state.data.items.map(item => (item.id === next.id ? next : item));
      list.replace({ ...list.state.data, items });
    }
  };

  return (
    <>
      <DepartureFilters filter={filter} onChange={change} onRefresh={list.retry} />
      {editing && lookups.state.status === "error" && (
        <ErrorState error={lookups.state.error} onRetry={lookups.retry} />
      )}
      {editing && lookups.state.status === "ready" && (
        <DepartureEditPanel key={editing.id} departure={editing} lookups={lookups.state.data}
          onSaved={next => { saved(next); setEditing(next); }} onClose={() => setEditing(null)} />
      )}
      {list.state.status === "loading" && <LoadingState label="Đang tải lịch khởi hành…" />}
      {list.state.status === "error" && <ErrorState error={list.state.error} onRetry={list.retry} />}
      {list.state.status === "ready" && list.state.data.items.length === 0 && (
        <EmptyState title="Không có lịch khởi hành phù hợp bộ lọc" />
      )}
      {list.state.status === "ready" && list.state.data.items.length > 0 && (
        <>
          <DepartureTable departures={list.state.data.items} onEdit={setEditing} onChanged={saved} />
          <Pagination page={filter.page} pageCount={departurePageCount(list.state.data.total)}
            label="Trang lịch khởi hành" onChange={page => setFilter(current => ({ ...current, page }))} />
        </>
      )}
    </>
  );
}

interface FiltersProps {
  filter: DepartureFilter;
  onChange: (patch: Partial<DepartureFilter>) => void;
  onRefresh: () => void;
}

function DepartureFilters({ filter, onChange, onRefresh }: FiltersProps) {
  return (
    <div className="sh-toolbar" role="search" aria-label="Lọc lịch khởi hành">
      <label className="sh-field">
        Từ ngày
        <input type="date" value={filter.from} onChange={event => onChange({ from: event.target.value })} />
      </label>
      <label className="sh-field">
        Đến ngày
        <input type="date" value={filter.to} onChange={event => onChange({ to: event.target.value })} />
      </label>
      <label className="sh-field">
        Trạng thái
        <select value={filter.status} onChange={event => onChange({ status: event.target.value })}>
          <option value="">Tất cả</option>
          {STATUS_FILTERS.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </select>
      </label>
      <button type="button" className="btn btn-outline" onClick={onRefresh}>Làm mới</button>
      {filter.tourId && (
        <p className="adm-note">Đang xem lịch của một tour. <Link href={DEPARTURES_HREF}>Xem tất cả</Link></p>
      )}
    </div>
  );
}
