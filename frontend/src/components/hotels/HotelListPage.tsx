/* eslint-disable @next/next/no-img-element -- Existing destination illustrations, not property photos. */
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { tourIllustration } from "@/lib/tour-display";
import { formatCurrency, normalizeSearch } from "@/lib/format";
import { splitAmenities, stayParams, validateStay } from "@/lib/hotel-stay";
import { HotelSourceNotice, HotelStatus, StayFields, useHotelResource } from "./hotel-shared";
import type { HotelSource, Stay } from "@/types/hotel";

interface HotelListProps {
  source: HotelSource;
  initialStay: Stay;
  initialQuery: string;
}

export function HotelListPage({ source, initialStay, initialQuery }: HotelListProps) {
  const { state, retry } = useHotelResource(source);
  const [stay, setStay] = useState(initialStay);
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState({ stay: initialStay, query: initialQuery });
  const [error, setError] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState("");
  const [stars, setStars] = useState("");
  const [amenity, setAmenity] = useState("");
  const [sort, setSort] = useState("default");
  const [limit, setLimit] = useState(6);
  const hotels = state.status === "ready" ? state.hotels : [];
  const amenities = [...new Set(hotels.flatMap(hotel => splitAmenities(hotel.tienNghi)))].sort();
  const searchText = normalizeSearch(applied.query);
  const selectedAmenity = normalizeSearch(amenity);

  const rows = hotels.filter(hotel => {
    const matchesQuery = normalizeSearch(
      [hotel.tenKhachSan, hotel.thanhPho, hotel.diaChi].join(" "),
    ).includes(searchText);
    const matchesPrice = !maxPrice ||
      (hotel.giaTuVndDem !== null && hotel.giaTuVndDem <= Number(maxPrice));
    const matchesStars = !stars || hotel.hangSaoDemo === Number(stars);
    const matchesAmenity = !amenity ||
      splitAmenities(hotel.tienNghi).some(item => normalizeSearch(item) === selectedAmenity);

    return matchesQuery && matchesPrice && matchesStars && matchesAmenity;
  });

  if (sort === "name") {
    rows.sort((a, b) => (a.tenKhachSan || "").localeCompare(b.tenKhachSan || "", "vi"));
  } else if (sort === "low" || sort === "high") {
    rows.sort((a, b) => {
      if (a.giaTuVndDem === null && b.giaTuVndDem === null) return 0;
      if (a.giaTuVndDem === null) return 1;
      if (b.giaTuVndDem === null) return -1;

      const difference = a.giaTuVndDem - b.giaTuVndDem;
      return sort === "low" ? difference : -difference;
    });
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateStay(stay, undefined, false);
    setError(issue);
    if (issue) return;

    const trimmedQuery = query.trim();
    setApplied({ stay, query: trimmedQuery });
    setLimit(6);
    window.history.replaceState(null, "", "/hotels?" + stayParams(stay, source, trimmedQuery));
  }

  function clearFilters() {
    setMaxPrice("");
    setStars("");
    setAmenity("");
    setSort("default");
    setLimit(6);
    setQuery("");
    setApplied({ stay: applied.stay, query: "" });
    window.history.replaceState(null, "", "/hotels?" + stayParams(applied.stay, source));
  }

  return (
    <main id="main-content" className="sh-hotels">
      <section className="sh-hotel-hero">
        <div className="container">
          <span className="kicker">SÀIHÀNH · LƯU TRÚ TRONG NƯỚC</span>
          <h1>Một nơi dừng chân,<br /><em>thêm nhiều trải nghiệm.</em></h1>
          <p>Tìm chốn nghỉ phù hợp, dành thời gian cho những điều bạn yêu.</p>

          <form className="sh-hotel-search sh-hotel-panel" onSubmit={applySearch}>
            <label className="sh-hotel-destination">
              Bạn muốn nghỉ ở đâu?
              <input
                type="search"
                name="q"
                maxLength={200}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Địa điểm hoặc tên khách sạn"
              />
            </label>
            <StayFields stay={stay} onChange={setStay} optionalDates />
            <button className="btn btn-primary" type="submit">
              <Icon name="search" size={18} />Tìm khách sạn
            </button>
            {error && <p className="sh-hotel-error" role="alert">{error}</p>}
            <p className="sh-hotel-caption">
              Ngày và số khách sẽ được giữ khi xem phòng. Tìm kiếm danh mục chưa xác nhận phòng trống theo ngày.
            </p>
          </form>
        </div>
      </section>

      <div className="container sh-hotel-body">
        <HotelSourceNotice source={source} stay={applied.stay} />
        <div className="sh-hotel-list-layout">
          <aside className="sh-hotel-panel sh-hotel-filters" aria-label="Bộ lọc khách sạn">
            <div className="sh-hotel-filter-head">
              <h2>Lọc lựa chọn</h2>
              <button onClick={clearFilters}>Xóa bộ lọc</button>
            </div>
            <label>
              Giá tối đa / phòng / đêm
              <input
                type="number"
                min={0}
                step={1000}
                value={maxPrice}
                onChange={event => { setMaxPrice(event.target.value); setLimit(6); }}
                placeholder="Không giới hạn"
              />
            </label>
            <label>
              Hạng sao tham khảo
              <select value={stars} onChange={event => { setStars(event.target.value); setLimit(6); }}>
                <option value="">Tất cả</option>
                {[1, 2, 3, 4, 5].map(value => <option value={value} key={value}>{value} sao (demo)</option>)}
              </select>
            </label>
            <label>
              Tiện nghi
              <select value={amenity} onChange={event => { setAmenity(event.target.value); setLimit(6); }}>
                <option value="">Tất cả tiện nghi</option>
                {amenities.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <p className="sh-hotel-caption">
              Hạng sao trong nguồn dữ liệu là trường demo. Giá chưa bao gồm các khoản bổ sung chưa được cung cấp.
            </p>
          </aside>

          <section aria-label="Kết quả khách sạn" className="sh-hotel-results">
            <div className="sh-hotel-results-head">
              <div>
                <h2>Chọn nơi bạn muốn đến</h2>
                <p role="status">
                  {state.status === "ready" ? rows.length + " khách sạn phù hợp" : "Đang kiểm tra danh mục"}
                </p>
              </div>
              <label>
                Sắp xếp
                <select value={sort} onChange={event => setSort(event.target.value)}>
                  <option value="default">Theo danh mục</option>
                  <option value="low">Giá tăng dần</option>
                  <option value="high">Giá giảm dần</option>
                  <option value="name">Tên A → Z</option>
                </select>
              </label>
            </div>

            {state.status !== "ready" && <HotelStatus status={state.status} retry={retry} />}
            {state.status === "ready" && rows.length === 0 && (
              <div className="sh-hotel-panel sh-hotel-empty">
                <h3>Chưa tìm thấy nơi lưu trú phù hợp</h3>
                <p>Thử địa điểm khác hoặc mở rộng bộ lọc của bạn.</p>
                <button className="btn btn-outline" onClick={clearFilters}>Xóa từ khóa và bộ lọc</button>
              </div>
            )}
            {state.status === "ready" && rows.length > 0 && (
              <>
                <div className="sh-hotel-cards">
                  {rows.slice(0, limit).map(hotel => {
                    const href = "/hotels/" + encodeURIComponent(hotel.hotelId) + "?" + stayParams(applied.stay, source);

                    return (
                      <article className="sh-hotel-card" key={hotel.hotelId}>
                        <Link href={href} className="sh-hotel-card-image" aria-label={"Xem " + (hotel.tenKhachSan || hotel.hotelId)}>
                          <img
                            src={tourIllustration(hotel.thanhPho)}
                            alt={"Ảnh điểm đến " + (hotel.thanhPho || "Việt Nam") + " minh họa, không phải ảnh khách sạn"}
                            loading="lazy"
                            width={600}
                            height={400}
                          />
                          <span>Ảnh điểm đến minh họa</span>
                        </Link>
                        <div className="sh-hotel-card-content">
                          <span className="sh-hotel-badge">
                            {source === "demo" ? "Demo frontend" : "Danh mục API"}
                            {hotel.hangSaoDemo !== null && " · " + hotel.hangSaoDemo + " sao demo"}
                          </span>
                          <h3><Link href={href}>{hotel.tenKhachSan || "Khách sạn chưa có tên"}</Link></h3>
                          <p className="sh-hotel-location">
                            <Icon name="map" size={16} />{hotel.thanhPho || "Chưa có địa điểm"}
                          </p>
                          <p className="sh-hotel-caption">{hotel.diaChi || "Chưa có địa chỉ"}</p>
                          <div className="sh-hotel-chips">
                            {splitAmenities(hotel.tienNghi).slice(0, 4).map((item, index) => <span key={index}>{item}</span>)}
                          </div>
                          <div className="sh-hotel-card-bottom">
                            <div>
                              <small>Giá tham khảo từ / đêm</small>
                              <strong>{formatCurrency(hotel.giaTuVndDem)}</strong>
                            </div>
                            <Link className="btn btn-outline" href={href}>
                              Xem phòng <Icon name="arrow" size={16} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {limit < rows.length && (
                  <button className="btn btn-outline sh-hotel-more" onClick={() => setLimit(value => value + 6)}>
                    Xem thêm {Math.min(6, rows.length - limit)} khách sạn
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
