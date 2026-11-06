/* eslint-disable @next/next/no-img-element -- Figma Make reference images, explicitly illustrative. */
"use client";
import { useEffect, useState } from "react";
import { getHomeCatalog, type CatalogItem, type CatalogKind } from "@/services/home-catalog";
import { tourIllustration, tourPrice, tourDate } from "@/lib/tour-display";
import { Icon } from "@/components/ui/Icon";

export function CatalogCards({ items, kind }: { items: CatalogItem[]; kind: CatalogKind }) {
  return <div className={kind === "hotel" ? "hotel-grid" : "flight-grid"}>{items.map(item =>
    <article className={kind === "hotel" ? "hotel-card" : "flight-card"} key={item.id}>
      {kind === "hotel" ? <img src={tourIllustration(item.location)} alt={`Ảnh điểm đến minh họa: ${item.location}`} loading="lazy" width={600} height={360} /> : <span className="airline-icon"><Icon name="plane" /></span>}
      <div><small>{kind === "hotel" ? "Ảnh minh họa · Giá tham khảo / đêm" : `Ngày bay: ${tourDate(item.date)}`}</small>
        <h3>{item.title}</h3><p>{item.origin ? `${item.origin} → ` : ""}{item.location}</p>
        <p><strong>{tourPrice(item.price)}</strong></p>
        <details><summary>Thông tin tham khảo</summary><p>{item.note || "Nguồn: danh mục hệ thống. Chưa có thêm mô tả."}</p><p>Chưa hỗ trợ {kind === "hotel" ? "đặt phòng và kiểm tra phòng theo ngày" : "đặt vé và xác nhận ghế"} trực tuyến. Dữ liệu có thể là demo; giá và tình trạng cần được xác nhận trước khi đặt.</p></details>
      </div>
    </article>)}</div>;
}

export function HomeCatalog({ kind }: { kind: CatalogKind }) {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getHomeCatalog(kind, controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [kind, attempt]);
  if (error) return <div className="tour-api-state" role="alert"><p>Chưa tải được danh mục {kind === "hotel" ? "khách sạn" : "chuyến bay"}.</p><button className="btn btn-outline" onClick={() => { setError(false); setItems(null); setAttempt(v => v + 1); }}>Thử lại</button></div>;
  if (items === null) return <div className="home-skeleton" role="status" aria-busy="true">Đang tải dịch vụ…</div>;
  if (!items.length) return <p className="tour-api-state" role="status">Chưa có dữ liệu dịch vụ.</p>;
  return <><p className="tour-api-note">Danh mục từ hệ thống · Có thể bao gồm dữ liệu demo · Chưa xác nhận tình trạng còn chỗ.</p><CatalogCards items={items.slice(0, 3)} kind={kind} /></>;
}
