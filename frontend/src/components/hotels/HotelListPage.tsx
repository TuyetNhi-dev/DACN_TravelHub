"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { EMPTY_HOTEL_FILTERS, filterHotels, type HotelFilters, type HotelSort } from "@/lib/hotel-filters";
import { stayParams, validateStay } from "@/lib/hotel-stay";
import { getHotels } from "@/services/hotels";
import type { HotelSummary, Stay } from "@/types/hotel";
import { HotelCard } from "./HotelCard";
import { StayFields } from "./StayFields";

const PAGE_SIZE = 6;
const STAR_OPTIONS = [5, 4, 3, 2];

export function HotelListPage({ initialStay, initialQuery }: { initialStay: Stay; initialQuery: string }) {
  const { state, retry } = useResource("hotels", getHotels);
  const [stay, setStay] = useState(initialStay);
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState({ stay: initialStay, query: initialQuery });
  const [error, setError] = useState<string | null>(null);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateStay(stay);
    setError(issue);
    if (issue) return;
    setApplied({ stay, query: query.trim() });
    const params = stayParams(stay);
    if (query.trim()) params.set("q", query.trim());
    window.history.replaceState(null, "", "/hotels?" + params);
  }

  return (
    <main id="main-content" className="sh-hotels">
      <section className="sh-hotel-hero"><div className="container">
        <span className="kicker">SÀIHÀNH · LƯU TRÚ TRONG NƯỚC</span>
        <h1>Một nơi dừng chân,<br /><em>thêm nhiều trải nghiệm.</em></h1>
        <form className="sh-hotel-search sh-hotel-panel" onSubmit={search}>
          <label className="sh-hotel-destination">
            Bạn muốn nghỉ ở đâu?
            <input type="search" name="q" maxLength={200} value={query} placeholder="Thành phố hoặc tên khách sạn"
              onChange={event => setQuery(event.target.value)} />
          </label>
          <StayFields stay={stay} onChange={setStay} />
          <button className="btn btn-primary" type="submit"><Icon name="search" size={18} />Tìm khách sạn</button>
          {error && <p className="sh-hotel-error" role="alert">{error}</p>}
        </form>
      </div></section>
      <div className="container sh-hotel-body">
        <QuoteNotice service="hotel" />
        {state.status === "loading" && <LoadingState label="Đang tải danh sách khách sạn…" />}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
        {state.status === "ready" && (
          <HotelResults key={applied.query} hotels={state.data} stay={applied.stay} query={applied.query} />
        )}
      </div>
    </main>
  );
}

function HotelResults({ hotels, stay, query }: { hotels: HotelSummary[]; stay: Stay; query: string }) {
  const [filters, setFilters] = useState<HotelFilters>({ ...EMPTY_HOTEL_FILTERS, query });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const rows = filterHotels(hotels, filters);

  function change<K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }));
    setLimit(PAGE_SIZE);
  }

  return (
    <div className="sh-hotel-list-layout">
      <aside className="sh-hotel-panel sh-hotel-filters" aria-label="Bộ lọc khách sạn">
        <div className="sh-hotel-filter-head">
          <h2>Lọc lựa chọn</h2>
          <button type="button" onClick={() => setFilters({ ...EMPTY_HOTEL_FILTERS, query })}>Xóa bộ lọc</button>
        </div>
        <label>
          Giá tối đa / phòng / đêm
          <input type="number" min={0} step={50_000} value={filters.maxPrice} placeholder="Không giới hạn"
            onChange={event => change("maxPrice", event.target.value)} />
        </label>
        <label>
          Hạng sao
          <select value={filters.stars} onChange={event => change("stars", event.target.value)}>
            <option value="">Tất cả</option>
            {STAR_OPTIONS.map(value => <option value={value} key={value}>{value} sao</option>)}
          </select>
        </label>
      </aside>
      <section aria-label="Kết quả khách sạn" className="sh-hotel-results">
        <div className="sh-hotel-results-head">
          <div><h2>Chọn nơi bạn muốn đến</h2><p role="status">{rows.length} khách sạn phù hợp</p></div>
          <label>
            Sắp xếp
            <select value={filters.sort} onChange={event => change("sort", event.target.value as HotelSort)}>
              <option value="default">Phù hợp nhất</option>
              <option value="low">Giá tăng dần</option>
              <option value="high">Giá giảm dần</option>
              <option value="stars">Hạng sao cao nhất</option>
            </select>
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Chưa tìm thấy nơi lưu trú phù hợp">
            <p>Thử địa điểm khác hoặc nới rộng bộ lọc.</p>
          </EmptyState>
        ) : (
          <>
            <div className="sh-hotel-cards">
              {rows.slice(0, limit).map(hotel => <HotelCard key={hotel.id} hotel={hotel} stay={stay} />)}
            </div>
            {limit < rows.length && (
              <button className="btn btn-outline sh-hotel-more" onClick={() => setLimit(value => value + PAGE_SIZE)}>
                Xem thêm khách sạn
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
