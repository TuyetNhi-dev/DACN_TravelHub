"use client";

import { FilterSheet } from "@/components/listing/FilterSheet";
import type { HotelFilters } from "@/lib/hotel-filters";

const STAR_OPTIONS = [5, 4, 3, 2];
const PRICE_STEP = 50_000;
/** Same width as the .sh-hotel-list-layout single-column breakpoint in hotels.css. */
const SIDEBAR_MIN_WIDTH = 800;

interface HotelFiltersPanelProps {
  filters: HotelFilters;
  resultCount: number;
  onChange: <K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) => void;
  onReset: () => void;
}

/** Sidebar on wide screens; a bottom sheet behind a "Bộ lọc" button on phones. */
export function HotelFiltersPanel({ filters, resultCount, onChange, onReset }: HotelFiltersPanelProps) {
  const activeCount = [filters.maxPrice, filters.stars].filter(Boolean).length;
  return (
    <FilterSheet label="Bộ lọc khách sạn" activeCount={activeCount} resultCount={resultCount}
      sheetBelow={SIDEBAR_MIN_WIDTH} className="sh-hotel-filters-slot">
      <div className="sh-hotel-panel sh-hotel-filters">
        <div className="sh-hotel-filter-head">
          <h2>Lọc lựa chọn</h2>
          <button type="button" onClick={onReset}>Xóa bộ lọc</button>
        </div>
        <label>
          Giá tối đa / phòng / đêm
          <input type="number" inputMode="numeric" min={0} step={PRICE_STEP} value={filters.maxPrice}
            placeholder="Không giới hạn" onChange={event => onChange("maxPrice", event.target.value)} />
        </label>
        <label>
          Hạng sao
          <select value={filters.stars} onChange={event => onChange("stars", event.target.value)}>
            <option value="">Tất cả</option>
            {STAR_OPTIONS.map(value => <option value={value} key={value}>{value} sao</option>)}
          </select>
        </label>
      </div>
    </FilterSheet>
  );
}
