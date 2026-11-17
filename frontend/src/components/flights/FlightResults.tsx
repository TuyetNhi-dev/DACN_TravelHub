"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import {
  DAY_PERIODS, EMPTY_FLIGHT_FILTERS, airportCode, airportLabel, applyFlightFilters, flightSearchParams,
  type FlightFilters, type FlightSort,
} from "@/lib/flight-search";
import { formatDate } from "@/lib/format";
import { searchFlights } from "@/services/flights";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlightCard } from "./FlightCard";

export function FlightResults({ search }: { search: FlightSearch }) {
  const query = { from: airportCode(search.from), to: airportCode(search.to), date: search.date, cabin: search.cabin };
  const key = JSON.stringify(query);
  const { state, retry } = useResource(key, signal => searchFlights(query, signal));
  return (
    <section aria-label="Kết quả chuyến bay">
      <div className="sf-results-title">
        <div>
          <span className="kicker">CHUYẾN BAY MỘT CHIỀU</span>
          <h2>{airportLabel(query.from)} → {airportLabel(query.to)}</h2>
          <p>{formatDate(search.date)} · {search.passengers} hành khách</p>
        </div>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tìm chuyến bay…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && <FlightList key={key} offers={state.data} search={search} />}
    </section>
  );
}

function FlightList({ offers, search }: { offers: FlightOffer[]; search: FlightSearch }) {
  const [filters, setFilters] = useState<FlightFilters>(EMPTY_FLIGHT_FILTERS);
  const rows = applyFlightFilters(offers, filters);
  const airlines = [...new Set(offers.map(offer => offer.airline))].sort();
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
      <aside className="sf-panel sf-filters" aria-label="Bộ lọc chuyến bay">
        <h3>Bộ lọc</h3>
        <label>
          Hãng hàng không
          <select value={filters.airline} onChange={event => change("airline", event.target.value)}>
            <option value="">Tất cả hãng</option>
            {airlines.map(airline => <option key={airline}>{airline}</option>)}
          </select>
        </label>
        <label>
          Giá tối đa (đ/khách)
          <input type="number" min={0} step={50_000} value={filters.maxPrice}
            onChange={event => change("maxPrice", event.target.value)} />
        </label>
        <label>
          Giờ khởi hành
          <select value={filters.period} onChange={event => change("period", event.target.value)}>
            <option value="">Cả ngày</option>
            {DAY_PERIODS.map(period => <option key={period.value} value={period.value}>{period.label}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-outline" onClick={() => setFilters(EMPTY_FLIGHT_FILTERS)}>
          Xóa bộ lọc
        </button>
      </aside>
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
          <FlightCard key={offer.offerId} offer={offer} passengers={search.passengers} action={
            <Link className="btn btn-primary" href={bookingHref(search, offer)}>Chọn chuyến</Link>
          } />
        ))}
      </div>
    </div>
  );
}

function bookingHref(search: FlightSearch, offer: FlightOffer): string {
  const params = flightSearchParams(search);
  params.set("offer", offer.offerId);
  return "/flights/booking?" + params;
}
