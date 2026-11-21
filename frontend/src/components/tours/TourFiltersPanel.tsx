"use client";

import { FilterSheet } from "@/components/listing/FilterSheet";
import { formatCurrency, vietnamToday } from "@/lib/format";
import { DURATION_OPTIONS, type TourFilters } from "@/lib/tour-display";

const PRICE_STEP = 100_000;
/** Same width as the .listing-layout breakpoint in listing.css. */
const SIDEBAR_MIN_WIDTH = 980;

interface TourFiltersPanelProps {
  filters: TourFilters;
  activeCount: number;
  resultCount: number;
  destinations: string[];
  priceCeiling: number;
  onChange: <K extends keyof TourFilters>(key: K, value: TourFilters[K]) => void;
  onReset: () => void;
}

/** Sticky sidebar on wide screens; a bottom sheet behind a "Bộ lọc" button on phones and tablets. */
export function TourFiltersPanel(props: TourFiltersPanelProps) {
  return (
    <FilterSheet label="Bộ lọc tour" activeCount={props.activeCount} resultCount={props.resultCount}
      sheetBelow={SIDEBAR_MIN_WIDTH} className="listing-filters">
      <div className="listing-filters-body">
        <div className="listing-filters-title">
          <b>Bộ lọc tìm kiếm</b>
          {props.activeCount > 0 && <button type="button" onClick={props.onReset}>Xóa bộ lọc</button>}
        </div>
        <FilterFields {...props} />
        <p className="listing-filters-note">
          Giá từ là giá cơ bản cho một người lớn. Giá chính xác theo từng lịch khởi hành.
        </p>
      </div>
    </FilterSheet>
  );
}

function FilterFields({ filters, destinations, priceCeiling, onChange }: TourFiltersPanelProps) {
  return (
    <>
      <label className="listing-field">
        <span>Điểm đến</span>
        <select value={filters.destination} onChange={event => onChange("destination", event.target.value)}>
          <option value="">Tất cả điểm đến</option>
          {destinations.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="listing-field">
        <span>Ngày khởi hành</span>
        <input type="date" min={vietnamToday()} value={filters.date}
          onChange={event => onChange("date", event.target.value)} />
      </label>
      <fieldset className="listing-field">
        <legend>Thời lượng</legend>
        <div className="listing-pills">
          {DURATION_OPTIONS.map(option => (
            <button key={option.value} type="button" aria-pressed={filters.duration === option.value}
              onClick={() => onChange("duration", option.value)}>{option.label}</button>
          ))}
        </div>
      </fieldset>
      <label className="listing-field">
        <span>Giá tối đa / người lớn</span>
        <input type="range" min={0} max={priceCeiling} step={PRICE_STEP} value={filters.maxPrice || priceCeiling}
          onChange={event => onChange("maxPrice", unlimitedAt(event.target.value, priceCeiling))} />
        <output>{filters.maxPrice ? formatCurrency(Number(filters.maxPrice)) : "Không giới hạn"}</output>
      </label>
    </>
  );
}

/** The slider's right end means "no limit", so it clears the filter instead of capping at the top price. */
function unlimitedAt(value: string, ceiling: number): string {
  return value === String(ceiling) ? "" : value;
}
