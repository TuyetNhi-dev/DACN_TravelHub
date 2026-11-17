"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency, vietnamToday } from "@/lib/format";
import { DURATION_OPTIONS, type TourFilters } from "@/lib/tour-display";

const PRICE_STEP = 100_000;

interface TourFiltersPanelProps {
  filters: TourFilters;
  activeCount: number;
  destinations: string[];
  priceCeiling: number;
  onChange: <K extends keyof TourFilters>(key: K, value: TourFilters[K]) => void;
  onReset: () => void;
}

/** Sticky sidebar on wide screens; a collapsible panel behind a "Bộ lọc" button on phones. */
export function TourFiltersPanel(props: TourFiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <aside className={open ? "listing-filters is-open" : "listing-filters"} aria-label="Bộ lọc tour">
      <button type="button" className="listing-filters-toggle" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(value => !value)}>
        <Icon name="menu" size={18} />Bộ lọc{props.activeCount > 0 && <span>{props.activeCount}</span>}
      </button>
      <div id={panelId} className="listing-filters-body">
        <div className="listing-filters-title">
          <b>Bộ lọc tìm kiếm</b>
          {props.activeCount > 0 && <button type="button" onClick={props.onReset}>Xóa bộ lọc</button>}
        </div>
        <FilterFields {...props} />
        <p className="listing-filters-note">
          Giá từ là giá cơ bản cho một người lớn. Giá chính xác theo từng lịch khởi hành.
        </p>
      </div>
    </aside>
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
