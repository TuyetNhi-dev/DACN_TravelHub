"use client";

import { LISTING_CARD_SIZES, TourCard } from "@/components/home/TourCard";
import { ActiveFilterChips } from "@/components/listing/ActiveFilterChips";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import type { ApiError } from "@/lib/api-client";
import { regionLabel, type Region } from "@/lib/departure-region";
import { activeTourFilters, EMPTY_TOUR_FILTERS, type PriceSort, type TourFilters } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";
import type { DateFilterData } from "./TourDateFilter";
import { TourFiltersPanel } from "./TourFiltersPanel";

const SKELETON_COUNT = 6;
const SORT_OPTIONS: { value: PriceSort; label: string }[] = [
  { value: "", label: "Mặc định" },
  { value: "low", label: "Giá thấp đến cao" },
  { value: "high", label: "Giá cao đến thấp" },
];

/** What a list of tours shows: either computed in the page (a collection) or one page from the server. */
export type TourResultsState =
  | { status: "loading" }
  | { status: "error"; error: ApiError; retry: () => void }
  | { status: "ready"; rows: TourSummary[]; total: number; pageCount: number };

interface TourResultsViewProps {
  filters: TourFilters;
  onFiltersChange: (filters: TourFilters) => void;
  results: TourResultsState;
  page: number;
  onPage: (page: number) => void;
  destinations: string[];
  priceCeiling: number;
  dateFilter: DateFilterData;
  region: Region;
  showAll: () => void;
  /** Extra line under the summary, e.g. why some tours have no departure region. */
  note?: string;
}

/** Filters, toolbar, active chips, cards and pages of /tours; where the rows come from is the caller's business. */
export function TourResultsView(props: TourResultsViewProps) {
  const { filters, onFiltersChange, results, region } = props;
  const chips = activeTourFilters(filters);
  const total = results.status === "ready" ? results.total : 0;
  const change = <K extends keyof TourFilters>(key: K, value: TourFilters[K]) =>
    onFiltersChange({ ...filters, [key]: value });
  const reset = () => onFiltersChange({ ...EMPTY_TOUR_FILTERS, sort: filters.sort });
  return (
    <div className="listing-layout">
      <TourFiltersPanel filters={filters} activeCount={chips.length} resultCount={total}
        destinations={props.destinations} priceCeiling={props.priceCeiling} dateFilter={props.dateFilter}
        onChange={change} onReset={reset} />
      <section className="listing-results" aria-label="Kết quả tìm tour" aria-busy={results.status === "loading"}>
        <ResultsToolbar filters={filters} onChange={change} />
        <div className="listing-summary">
          <p aria-live="polite">
            {results.status === "ready" ? <><strong>{total}</strong> tour phù hợp</> : "Đang tìm tour…"}
          </p>
          <span className="listing-context">
            <Icon name="map" size={14} />Khởi hành: <strong>{regionLabel(region)}</strong>
            {region !== "all" && <button type="button" onClick={props.showAll}>Xem tất cả</button>}
          </span>
        </div>
        <ActiveFilterChips chips={chips} onRemove={key => change(key, EMPTY_TOUR_FILTERS[key])} onClear={reset} />
        {props.note && <p className="listing-note">{props.note}</p>}
        <ResultsBody {...props} onReset={reset} />
      </section>
    </div>
  );
}

function ResultsToolbar({ filters, onChange }: {
  filters: TourFilters;
  onChange: <K extends keyof TourFilters>(key: K, value: TourFilters[K]) => void;
}) {
  return (
    <div className="listing-toolbar">
      <label className="listing-search">
        <Icon name="search" size={18} />
        <span className="sr-only">Tìm theo tên, điểm đến hoặc mã tour</span>
        <input type="search" value={filters.query} maxLength={200} placeholder="Tìm tên tour, điểm đến, mã tour"
          onChange={event => onChange("query", event.target.value)} />
      </label>
      <label className="listing-sort">
        <span>Sắp xếp</span>
        <select value={filters.sort} onChange={event => onChange("sort", event.target.value as PriceSort)}>
          {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function ResultsBody({ results, page, onPage, region, showAll, onReset }: TourResultsViewProps & {
  onReset: () => void;
}) {
  if (results.status === "loading") return <CardSkeletons count={SKELETON_COUNT} label="Đang tải danh sách tour…" />;
  if (results.status === "error") return <ErrorState error={results.error} onRetry={results.retry} />;
  if (results.total === 0) return <NoTours region={region} onReset={onReset} showAll={showAll} />;
  return (
    <>
      <div className="listing-grid">
        {results.rows.map(tour => <TourCard key={tour.id} tour={tour} sizes={LISTING_CARD_SIZES} />)}
      </div>
      <Pagination page={page} pageCount={results.pageCount} onChange={onPage} label="Phân trang tour" />
    </>
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
