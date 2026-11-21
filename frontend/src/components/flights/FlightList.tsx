"use client";

import { useState, type ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import {
  DAY_PERIODS, EMPTY_FLIGHT_FILTERS, airportCode, applyFlightFilters, type FlightFilters, type FlightSort,
} from "@/lib/flight-search";
import { seatShortage } from "@/lib/flight-deals";
import { searchFlights } from "@/services/flights";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlightCard } from "./FlightCard";

interface FlightLegOffersProps {
  search: FlightSearch;
  renderAction: (offer: FlightOffer) => ReactNode;
}

/** Quotes for one leg (route + day) with the client-side filters; the caller decides what choosing does. */
export function FlightLegOffers({ search, renderAction }: FlightLegOffersProps) {
  const query = { from: airportCode(search.from), to: airportCode(search.to), date: search.date, cabin: search.cabin };
  const key = JSON.stringify(query);
  const { state, retry } = useResource(key, signal => searchFlights(query, signal));
  if (state.status === "loading") return <LoadingState label="Đang tìm chuyến bay…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  return <FlightList key={key} offers={state.data} passengers={search.passengers} renderAction={renderAction} />;
}

interface FlightListProps {
  offers: FlightOffer[];
  passengers: number;
  renderAction: (offer: FlightOffer) => ReactNode;
}

function FlightList({ offers, passengers, renderAction }: FlightListProps) {
  const [filters, setFilters] = useState<FlightFilters>(EMPTY_FLIGHT_FILTERS);
  const rows = applyFlightFilters(offers, filters);
  const change = <K extends keyof FlightFilters>(key: K, value: FlightFilters[K]) =>
    setFilters(current => ({ ...current, [key]: value }));

  if (offers.length === 0) {
    return (
      <EmptyState title="Chưa có báo giá cho hành trình này">
        <p>Đối tác chưa có giá cho ngày và hạng vé đã chọn. Hãy thử ngày khác hoặc hạng vé khác.</p>
      </EmptyState>
    );
  }
  return (
    <div className="sf-layout">
      <FlightFiltersPanel offers={offers} filters={filters} onChange={change}
        onReset={() => setFilters(EMPTY_FLIGHT_FILTERS)} />
      <div className="sf-results">
        <label className="sf-sort">
          Sắp xếp
          <select value={filters.sort} onChange={event => change("sort", event.target.value as FlightSort)}>
            <option value="price">Giá thấp nhất</option>
            <option value="departure">Khởi hành sớm nhất</option>
            <option value="duration">Bay nhanh nhất</option>
          </select>
        </label>
        {rows.length === 0 && <EmptyState title="Không có chuyến bay khớp bộ lọc" />}
        {rows.map(offer => (
          <FlightCard key={offer.offerId} offer={offer} passengers={passengers} action={
            seatShortage(offer, passengers)
              ? <p className="fd-shortage" role="note">{seatShortage(offer, passengers)}</p>
              : renderAction(offer)
          } />
        ))}
      </div>
    </div>
  );
}

interface FlightFiltersPanelProps {
  offers: FlightOffer[];
  filters: FlightFilters;
  onChange: <K extends keyof FlightFilters>(key: K, value: FlightFilters[K]) => void;
  onReset: () => void;
}

function FlightFiltersPanel({ offers, filters, onChange, onReset }: FlightFiltersPanelProps) {
  const airlines = [...new Set(offers.map(offer => offer.airline))].sort();
  return (
    <aside className="sf-panel sf-filters" aria-label="Bộ lọc chuyến bay">
      <h3>Bộ lọc</h3>
      <label>
        Hãng hàng không
        <select value={filters.airline} onChange={event => onChange("airline", event.target.value)}>
          <option value="">Tất cả hãng</option>
          {airlines.map(airline => <option key={airline}>{airline}</option>)}
        </select>
      </label>
      <label>
        Giá tối đa (đ/khách)
        <input type="number" inputMode="numeric" min={0} step={50_000} value={filters.maxPrice}
          onChange={event => onChange("maxPrice", event.target.value)} />
      </label>
      <label>
        Giờ khởi hành
        <select value={filters.period} onChange={event => onChange("period", event.target.value)}>
          <option value="">Cả ngày</option>
          {DAY_PERIODS.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}
        </select>
      </label>
      <button type="button" className="btn btn-outline" onClick={onReset}>Xóa bộ lọc</button>
    </aside>
  );
}
