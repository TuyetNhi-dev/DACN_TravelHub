"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { EMPTY_HOTEL_FILTERS, filterHotels, type HotelFilters, type HotelSort } from "@/lib/hotel-filters";
import { stayParams, validateStay } from "@/lib/hotel-stay";
import { getHotels } from "@/services/hotels";
import type { HotelSummary, Stay } from "@/types/hotel";
import { HotelCard } from "./HotelCard";
import { HotelFiltersPanel } from "./HotelFiltersPanel";
import { StayFields } from "./StayFields";

const PAGE_SIZE = 12;

export function HotelListPage({ initialStay, initialQuery }: { initialStay: Stay; initialQuery: string }) {
  const loader = useCallback((signal: AbortSignal) => getHotels({ page: 1, pageSize: PAGE_SIZE }, signal), []);
  const { state, retry, replace } = useResource("hotels", loader);
  const [stay, setStay] = useState(initialStay);
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState({ stay: initialStay, query: initialQuery });
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

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

  async function loadMore(currentItems: HotelSummary[], nextPage: number) {
    setLoadingMore(true);
    try {
      const { items, total } = await getHotels({ page: nextPage, pageSize: PAGE_SIZE });
      replace({ items: [...currentItems, ...items], total });
    } finally {
      setLoadingMore(false);
    }
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
          <HotelResults key={applied.query} hotels={state.data.items} total={state.data.total}
            stay={applied.stay} query={applied.query} loadingMore={loadingMore}
            onLoadMore={() => {
              const nextPage = Math.ceil(state.data.items.length / PAGE_SIZE) + 1;
              void loadMore(state.data.items, nextPage);
            }} />
        )}
      </div>
    </main>
  );
}

interface HotelResultsProps {
  hotels: HotelSummary[];
  total: number;
  stay: Stay;
  query: string;
  loadingMore: boolean;
  onLoadMore: () => void;
}

function HotelResults({ hotels, total, stay, query, loadingMore, onLoadMore }: HotelResultsProps) {
  const [filters, setFilters] = useState<HotelFilters>({ ...EMPTY_HOTEL_FILTERS, query });
  const rows = filterHotels(hotels, filters);
  const hasMore = hotels.length < total;

  function change<K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  return (
    <div className="sh-hotel-list-layout">
      <HotelFiltersPanel filters={filters} resultCount={rows.length} onChange={change}
        onReset={() => setFilters({ ...EMPTY_HOTEL_FILTERS, query })} />
      <section aria-label="Kết quả khách sạn" className="sh-hotel-results">
        <div className="sh-hotel-results-head">
          <div>
            <h2>Chọn nơi bạn muốn đến</h2>
            <p role="status">{rows.length} khách sạn phù hợp{hasMore && ` (đang hiển thị ${hotels.length}/${total})`}</p>
          </div>
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
              {rows.map(hotel => <HotelCard key={hotel.id} hotel={hotel} stay={stay} />)}
            </div>
            {hasMore && (
              <button className="btn btn-outline sh-hotel-more" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? "Đang tải…" : "Xem thêm khách sạn"}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
