"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { TOUR_STATUS } from "@/lib/admin-labels";
import { pageCountOf, TOUR_NEW_HREF, tourEditHref } from "@/lib/admin-tours";
import { formatCurrency } from "@/lib/format";
import { tourDuration } from "@/lib/tour-display";
import { getAdminTours, type TourFilter } from "@/services/admin-catalog";
import type { AdminTourSummary, TourStatus } from "@/types/admin";
import { useAdmin } from "../shell/AdminProvider";
import { TourStatusBadge } from "./TourStatusBadge";

const FIRST_PAGE: TourFilter = { status: "", query: "", page: 1 };
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
  const { state, retry } = useResource(`admin-tours:${scope}:${JSON.stringify(filter)}`,
    signal => getAdminTours(filter, scope, signal));

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilter({ ...filter, query: String(new FormData(event.currentTarget).get("q") ?? ""), page: 1 });
  }

  return (
    <>
      <form className="sh-toolbar" role="search" aria-label="Lọc tour" onSubmit={search}>
        <label className="sh-field">
          Mã hoặc tên tour
          <input name="q" type="search" defaultValue={filter.query} maxLength={100} />
        </label>
        <label className="sh-field">
          Trạng thái
          <select value={filter.status}
            onChange={event => setFilter({ ...filter, status: event.target.value as TourStatus | "", page: 1 })}>
            <option value="">Tất cả</option>
            {STATUS_FILTERS.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </label>
        <button className="btn btn-outline" type="submit">Tìm</button>
      </form>
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
    </>
  );
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
