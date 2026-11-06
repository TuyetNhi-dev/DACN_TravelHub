/* eslint-disable @next/next/no-img-element -- Clearly labelled prototype illustrations. */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getTours, getTour } from "@/services/tours";
import type { Tour, TourDeparture } from "@/types/tour";
import { emptyTourFilters, filterTours, tourDuration, tourHref, tourIllustration, tourPrice, type TourFilters } from "@/lib/tour-display";
import { Icon } from "@/components/ui/Icon";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { departureRegion, filterByDeparture, regionLabel, type Region } from "@/lib/departure-region";

type ListState = { status: "loading" } | { status: "error" } | { status: "ready"; tours: Tour[] };
type ScheduleState = { status: "idle" | "loading" | "error" } |
  { status: "ready"; data: Record<string, TourDeparture[]> };

export function TourList({ initialQuery = "" }: { initialQuery?: string }) {
  const { region, choose } = useDeparture();
  if (region === null) return <main id="main-content" className="tour-api-state" role="status">Đang tải lựa chọn khởi hành…</main>;
  return <TourListContent key={region + ":" + initialQuery} region={region} initialQuery={initialQuery} showAll={() => choose("all")} />;
}

function TourListContent({ region, showAll, initialQuery }: { region: Region; showAll: () => void; initialQuery: string }) {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<TourFilters>({ ...emptyTourFilters, query: initialQuery });
  const [page, setPage] = useState(1);
  const [schedules, setSchedules] = useState<ScheduleState>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    getTours(controller.signal).then(list => {
      if (!controller.signal.aborted) setState({ status: "ready", tours: list.data });
    }).catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);

  // Only load all schedules when the date filter is actually requested.
  const needsDates = Boolean(filters.date);
  const tours = state.status === "ready" ? state.tours : null;
  useEffect(() => {
    if (!needsDates || !tours) return;
    const controller = new AbortController();
    async function loadSchedules() {
      const data: Record<string, TourDeparture[]> = {};
      let cursor = 0;
      try {
        await Promise.all(Array.from({ length: Math.min(5, tours!.length) }, async () => {
          while (cursor < tours!.length && !controller.signal.aborted) {
            const tour = tours![cursor++];
            data[tour.tourId] = (await getTour(tour.tourId, controller.signal)).departures;
          }
        }));
        if (!controller.signal.aborted) setSchedules({ status: "ready", data });
      } catch {
        if (!controller.signal.aborted) setSchedules({ status: "error" });
        controller.abort();
      }
    }
    void loadSchedules();
    return () => controller.abort();
  }, [needsDates, tours, attempt]);

  function change(key: keyof TourFilters, value: string) {
    if (key === "date" && value && !filters.date) setSchedules({ status: "loading" });
    setFilters(current => ({ ...current, [key]: value }));
    setPage(1);
  }
  function retry() {
    setState({ status: "loading" }); setSchedules({ status: "loading" });
    setPage(1); setAttempt(value => value + 1);
  }
  const rows = state.status === "ready" ? filterTours(filterByDeparture(state.tours, region), filters,
    schedules.status === "ready" ? schedules.data : {}) : [];
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const invalidRange = Boolean(filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice));
  const destinations = [...new Set((tours || []).map(t => t.diemDen).filter((v): v is string => Boolean(v)))].sort();
  const priceCeiling = Math.max(1000000, ...((tours || []).map(t => t.giaNguoiLonVnd || 0)));
  return <main id="main-content" className="page-main tours-page">
    <div className="page-banner"><div className="container">
      <div className="breadcrumb"><Link href="/">Trang chủ</Link><Icon name="chevron" size={14} /><span>Tour du lịch</span></div>
      <h1>Khám phá tour du lịch</h1><p>Tìm hành trình phù hợp với kế hoạch và ngân sách của bạn.</p>
      <form className="list-search" onSubmit={event => event.preventDefault()}>
        <label><Icon name="map" /><span>Tìm tour<input value={filters.query} onChange={e => change("query", e.target.value)} placeholder="Tên tour, điểm đến hoặc mã tour" /></span></label>
        <label><Icon name="calendar" /><span>Ngày khởi hành<input type="date" value={filters.date} onChange={e => change("date", e.target.value)} /></span></label>
        <label><Icon name="clock" /><span>Thời lượng<select value={filters.duration} onChange={e => change("duration", e.target.value)}><option value="">Tất cả</option><option value="short">Tối đa 3 ngày</option><option value="medium">4 – 5 ngày</option><option value="long">Trên 5 ngày</option></select></span></label>
        <button className="btn btn-primary" type="submit"><Icon name="search" />Tìm tour</button>
      </form>
    </div></div>
    <div className="container listing-layout">
      <aside className="filters" aria-label="Bộ lọc tour">
        <div className="filter-title"><b>Bộ lọc tìm kiếm</b><button onClick={() => { setFilters(emptyTourFilters); setPage(1); }}>Xóa bộ lọc</button></div>
        <div className="filter-group"><b>Điểm đến</b><div className="destination-filter-options" role="group" aria-label="Chọn điểm đến">
          {destinations.map(value => <label key={value}><input type="checkbox" checked={filters.destination === value} onChange={() => change("destination", filters.destination === value ? "" : value)} />{value}</label>)}
          {!destinations.length && <span>Chưa có điểm đến.</span>}
        </div></div>
        <div className="filter-group"><b>Khoảng giá người lớn (VND)</b>
          <label className="price-range-label">Giá tối đa<input type="range" min="0" max={priceCeiling} step="1000" value={filters.maxPrice || priceCeiling} onChange={e => change("maxPrice", e.target.value)} /></label>
          <div className="price-filter-inputs"><label>Từ<input type="number" min="0" step="1000" value={filters.minPrice} onChange={e => change("minPrice", e.target.value)} placeholder="Không giới hạn" /></label>
          <label>Đến<input type="number" min="0" step="1000" value={filters.maxPrice} onChange={e => change("maxPrice", e.target.value)} placeholder="Không giới hạn" /></label></div>
          {invalidRange && <span role="alert">Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.</span>}
        </div>
        <label className="filter-group"><b>Thời lượng</b><select value={filters.duration} onChange={e => change("duration", e.target.value)}>
          <option value="">Tất cả</option><option value="short">Tối đa 3 ngày</option><option value="medium">4 – 5 ngày</option><option value="long">Trên 5 ngày</option>
        </select></label>
        <label className="filter-group"><b>Ngày khởi hành</b><input type="date" value={filters.date} onChange={e => change("date", e.target.value)} /></label>
        <p className="tour-api-note">Giá cơ bản mỗi người lớn. Chọn lịch ở trang chi tiết để xem giá và số chỗ.</p>
      </aside>
      <section className="listing-results" aria-label="Kết quả tìm tour">
        <div className="results-head"><div><h2>Tour phù hợp</h2><span aria-live="polite">{state.status === "ready" && (!needsDates || schedules.status === "ready") ? rows.length + "/" + state.tours.length + " tour" : "Đang kiểm tra dữ liệu"}</span></div>
          <label>Sắp xếp<select value={filters.sort} onChange={e => change("sort", e.target.value)}><option value="">Mặc định</option><option value="low">Giá thấp đến cao</option><option value="high">Giá cao đến thấp</option></select></label>
        </div>
        <div className="tour-results-context"><span><Icon name="map" size={14} />Khởi hành: <strong>{regionLabel(region)}</strong></span><span>Ảnh minh họa · Phân loại dữ liệu theo từng tour</span>
          {region !== "all" && <button className="tour-context-reset" onClick={showAll}>Xem tất cả tour</button>}
        </div>
        {state.status === "ready" && state.tours.some(t => departureRegion(t.diemKhoiHanh) === null) &&
          <p className="tour-api-note">Một số điểm khởi hành chưa xác định được vùng. Chọn Xem tất cả tour để không bỏ sót các tour này.</p>}
        {state.status === "error" || (needsDates && schedules.status === "error") ?
          <div className="tour-api-state" role="alert"><h3>Chưa tải được {state.status === "error" ? "danh sách tour" : "đầy đủ lịch khởi hành"}</h3><p>Không thay thế bằng dữ liệu mẫu. Vui lòng thử lại.</p><button className="btn btn-outline" onClick={retry}>Thử lại</button></div> :
          state.status === "loading" || (needsDates && schedules.status !== "ready") ?
          <div className="tour-api-state" role="status">Đang tải {needsDates ? "lịch khởi hành" : "tour"}…</div> :
          !rows.length ? <div className="tour-api-state" role="status"><h3>Không tìm thấy tour</h3><p>Thử thay đổi khu vực khởi hành hoặc điều kiện tìm kiếm.</p><button className="btn btn-outline" onClick={() => { setFilters(emptyTourFilters); setPage(1); }}>Xóa bộ lọc</button><button className="btn btn-outline" onClick={showAll}>Xem tất cả tour</button></div> :
          <><div className="list-cards">{rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(tour => <article className="tour-list-card" key={tour.tourId}>
            <div className="list-illustration"><img src={tourIllustration(tour.diemDen)} alt="Ảnh du lịch minh họa" loading="lazy" /><span className="tour-illustration-label">Ảnh minh họa</span></div>
            <div className="tour-list-info"><span className="tour-code">{tour.tourId} · {tour.loaiDuLieu || "Chưa phân loại"}</span><span className="eyebrow"><Icon name="map" size={14} />{tour.diemKhoiHanh || "Chưa có điểm đi"} → {tour.diemDen || "Chưa có điểm đến"}</span>
              <h3><Link href={tourHref(tour.tourId)}>{tour.tenTour || "Tour chưa có tên"}</Link></h3>
              <div className="list-meta"><span><Icon name="clock" size={16} />{tourDuration(tour)}</span><span><Icon name="bus" size={16} />{tour.phuongTien || "Chưa có phương tiện"}</span></div>
              <div className="list-bottom"><div><small>Giá người lớn tham khảo</small><strong>{tourPrice(tour.giaNguoiLonVnd)}</strong></div><Link className="btn btn-primary" href={tourHref(tour.tourId)}>Xem chi tiết</Link></div>
            </div>
          </article>)}</div>
          <nav className="pagination" aria-label="Phân trang tour"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</button>{Array.from({ length: pageCount }, (_, i) => <button key={i} aria-current={currentPage === i + 1 ? "page" : undefined} className={currentPage === i + 1 ? "active" : ""} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau</button></nav></>}
      </section>
    </div>
  </main>;
}
