"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { TOUR_STATUS } from "@/lib/admin-labels";
import { pageCountOf, TOUR_NEW_HREF, TOUR_SORTS, tourEditHref } from "@/lib/admin-tours";
import { formatCurrency } from "@/lib/format";
import { tourDuration } from "@/lib/tour-display";
import { getAdminLookups, getAdminTours, type TourFilter } from "@/services/admin-catalog";
import type { AdminLookups, AdminTourSummary, TourStatus } from "@/types/admin";
import { useAdmin } from "../shell/AdminProvider";
import { TourStatusBadge } from "./TourStatusBadge";

const FIRST_PAGE: TourFilter = {
  status: "", query: "", page: 1, regionId: "", branchId: "", categoryId: "", sort: "",
};
const STATUS_FILTERS = Object.entries(TOUR_STATUS) as [TourStatus, { label: string }][];

export function AdminToursPage() {
  const { context } = useAdmin();
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head adm-page-head">
        <div>
          <span className="kicker">QUẢN TRỊ · SẢN PHẨM</span>
          <h1>Tour</h1>
          <p>Tour do các chi nhánh trong phạm vi đang chọn điều hành.</p>
        </div>
        {context.capabilities.manageCatalog && <ButtonLink href={TOUR_NEW_HREF}>Thêm tour</ButtonLink>}
      </div>
      <TourQueue />
    </main>
  );
}

function TourQueue() {
  const { scope } = useAdmin();
  const [filter, setFilter] = useState<TourFilter>(FIRST_PAGE);
  const lookups = useResource("admin:lookups", getAdminLookups);
  const { state, retry } = useResource(`admin-tours:${scope}:${JSON.stringify(filter)}`,
    signal => getAdminTours(filter, scope, signal));

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilter({ ...filter, query: String(new FormData(event.currentTarget).get("q") ?? ""), page: 1 });
  }

  const change = (patch: Partial<TourFilter>) => setFilter(current => ({ ...current, ...patch, page: 1 }));
  return <>
      <TourFilters filter={filter} lookups={lookups.state.status === "ready" ? lookups.state.data : null}
        onChange={change} onSearch={search} />
      {state.status === "loading" && <LoadingState label="Đang tải tour…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.items.length === 0 && <EmptyState title="Không có tour phù hợp" />}
      {state.status === "ready" && state.data.items.length > 0 && (
        <>
          <TourTable tours={state.data.items} />
          <Pagination page={filter.page} pageCount={pageCountOf(state.data.total)} label="Trang danh sách tour"
            onChange={page => setFilter({ ...filter, page })} />
        </>
      )}
    </>;
}

function TourFilters({ filter, lookups, onChange, onSearch }: {
  filter: TourFilter; lookups: AdminLookups | null; onChange: (patch: Partial<TourFilter>) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <form className="sh-toolbar" role="search" aria-label="Lọc tour" onSubmit={onSearch}>
    <label className="sh-field">Mã hoặc tên tour
      <input name="q" type="search" defaultValue={filter.query} maxLength={100} />
    </label>
    {lookups && <TourLookupFilters filter={filter} lookups={lookups} onChange={onChange} />}
    <label className="sh-field">Sắp xếp<select value={filter.sort}
      onChange={event => onChange({ sort: event.target.value })}>
      {TOUR_SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
    </select></label>
    <label className="sh-field">Trạng thái<select value={filter.status}
      onChange={event => onChange({ status: event.target.value as TourStatus | "" })}>
      <option value="">Tất cả</option>{STATUS_FILTERS.map(([value, meta]) =>
        <option key={value} value={value}>{meta.label}</option>)}
    </select></label>
    <button className="btn btn-outline" type="submit">Tìm</button>
  </form>;
}

function TourLookupFilters({ filter, lookups, onChange }: {
  filter: TourFilter; lookups: AdminLookups; onChange: (patch: Partial<TourFilter>) => void;
}) {
  return <>
    <label className="sh-field">Khu vực<select value={filter.regionId}
      onChange={event => onChange({ regionId: event.target.value, branchId: "" })}>
      <option value="">Tất cả khu vực</option>{lookups.regions.map(region =>
        <option key={region.id} value={region.id}>{region.name}</option>)}
    </select></label>
    <label className="sh-field">Chi nhánh<select value={filter.branchId}
      onChange={event => onChange({ branchId: event.target.value })}>
      <option value="">Tất cả chi nhánh</option>{lookups.branches
        .filter(branch => !filter.regionId || branch.regionId === filter.regionId)
        .map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select></label>
    <label className="sh-field">Danh mục<select value={filter.categoryId}
      onChange={event => onChange({ categoryId: event.target.value })}>
      <option value="">Tất cả danh mục</option>{lookups.categories.map(category =>
        <option key={category.id} value={category.id}>{category.name}</option>)}
    </select></label>
  </>;
}

// Header cells and the phone card labels (td[data-label]) share these names.
const COLUMNS = ["Tour", "Chi nhánh", "Thời lượng", "Giá từ", "Lịch sắp tới", "Trạng thái"] as const;
const [TOUR, BRANCH, DURATION, PRICE, UPCOMING, STATUS] = COLUMNS;

function TourTable({ tours }: { tours: AdminTourSummary[] }) {
  return (
    <div className="sh-table-wrap">
      <table className="sh-table sh-table--cards">
        <caption className="sr-only">Danh sách tour</caption>
        <thead><tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {tours.map(tour => (
            <tr key={tour.id}>
              <td data-label={TOUR}>
                <Link href={tourEditHref(tour.id)}>{tour.title}</Link>
                <small>{tour.code} · {tour.destination}</small>
              </td>
              <td data-label={BRANCH}>{tour.branchName}</td>
              <td data-label={DURATION}>{tourDuration(tour)}</td>
              <td data-label={PRICE}>{formatCurrency(tour.basePrice)}</td>
              <td data-label={UPCOMING}>{tour.upcomingDepartures}</td>
              <td data-label={STATUS}><TourStatusBadge status={tour.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
