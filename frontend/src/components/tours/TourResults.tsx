"use client";

import { useState } from "react";
import { TourCard } from "@/components/home/TourCard";
import { ActiveFilterChips } from "@/components/listing/ActiveFilterChips";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/StateMessage";
import { filterByDeparture, hasUnknownRegion, regionLabel, type Region } from "@/lib/departure-region";
import {
  activeTourFilters, destinationsOf, EMPTY_TOUR_FILTERS, filterTours, type ActiveFilter, type PriceSort,
  type TourFilters,
} from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";
import { TourFiltersPanel } from "./TourFiltersPanel";

const PAGE_SIZE = 9;
const MIN_PRICE_CEILING = 1_000_000;
const SORT_OPTIONS: { value: PriceSort; label: string }[] = [
  { value: "", label: "Mặc định" },
  { value: "low", label: "Giá thấp đến cao" },
  { value: "high", label: "Giá cao đến thấp" },
];

interface TourResultsProps {
  tours: TourSummary[];
  region: Region;
  initialFilters: TourFilters;
  showAll: () => void;
}

export function TourResults({ tours, region, initialFilters, showAll }: TourResultsProps) {
  const [filters, setFilters] = useState<TourFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const rows = filterTours(filterByDeparture(tours, region), filters);
  const chips = activeTourFilters(filters);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const priceCeiling = Math.max(MIN_PRICE_CEILING, ...tours.map(tour => tour.basePrice));

  function change<K extends keyof TourFilters>(key: K, value: TourFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }));
    setPage(1);
  }
  const remove = (key: ActiveFilter["key"]) => change(key, EMPTY_TOUR_FILTERS[key]);
  function reset() {
    setFilters(current => ({ ...EMPTY_TOUR_FILTERS, sort: current.sort }));
    setPage(1);
  }

  return (
    <div className="listing-layout">
      <TourFiltersPanel filters={filters} activeCount={chips.length} resultCount={rows.length}
        destinations={destinationsOf(tours)}
        priceCeiling={priceCeiling} onChange={change} onReset={reset} />
      <section className="listing-results" aria-label="Kết quả tìm tour">
        <div className="listing-toolbar">
          <label className="listing-search">
            <Icon name="search" size={18} />
            <span className="sr-only">Tìm theo tên, điểm đến hoặc mã tour</span>
            <input type="search" value={filters.query} maxLength={200}
              placeholder="Tìm tên tour, điểm đến, mã tour"
              onChange={event => change("query", event.target.value)} />
          </label>
          <label className="listing-sort">
            <span>Sắp xếp</span>
            <select value={filters.sort} onChange={event => change("sort", event.target.value as PriceSort)}>
              {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="listing-summary">
          <p aria-live="polite"><strong>{rows.length}</strong> tour phù hợp</p>
          <span className="listing-context">
            <Icon name="map" size={14} />Khởi hành: <strong>{regionLabel(region)}</strong>
            {region !== "all" && <button type="button" onClick={showAll}>Xem tất cả</button>}
          </span>
        </div>
        <ActiveFilterChips chips={chips} onRemove={remove} onClear={reset} />
        {region !== "all" && hasUnknownRegion(tours) && (
          <p className="listing-note">
            Một số tour chưa xác định được vùng khởi hành. Chọn “Xem tất cả” để không bỏ sót.
          </p>
        )}
        {rows.length === 0
          ? <NoTours region={region} onReset={reset} showAll={showAll} />
          : (
            <>
              <div className="listing-grid">
                {rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map(tour => <TourCard key={tour.id} tour={tour} />)}
              </div>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Phân trang tour" />
            </>
          )}
      </section>
    </div>
  );
}

function NoTours({ region, onReset, showAll }: { region: Region; onReset: () => void; showAll: () => void }) {
  return (
    <EmptyState title="Không tìm thấy tour phù hợp">
      <p>Thử bỏ bớt điều kiện lọc hoặc chọn khu vực khởi hành khác.</p>
      <div className="sh-state-actions">
        <button type="button" className="btn btn-outline" onClick={onReset}>Xóa bộ lọc</button>
        {region !== "all" && (
          <button type="button" className="btn btn-outline" onClick={showAll}>Xem tất cả tour</button>
        )}
      </div>
    </EmptyState>
  );
}
