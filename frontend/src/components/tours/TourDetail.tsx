/* eslint-disable @next/next/no-img-element -- Labelled illustrations, no database image field. */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getTour } from "@/services/tours";
import { ApiError } from "@/lib/api-client";
import { tourDate, tourDuration, tourIllustration, tourPrice } from "@/lib/tour-display";
import type { TourDetail as Detail } from "@/types/tour";
import { photos } from "@/data/home";

type State = { status: "loading" | "error" | "missing" } | { status: "ready"; detail: Detail };
export function TourDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [departureId, setDepartureId] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getTour(id, controller.signal).then(detail => {
      if (!controller.signal.aborted) setState({ status: "ready", detail });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: error instanceof ApiError && (error.status === 404 || error.status === 400) ? "missing" : "error" });
    });
    return () => controller.abort();
  }, [id, attempt]);
  if (state.status !== "ready") return <main id="main-content" className="page-main detail-page"><div className="container tour-api-state" role={state.status === "error" ? "alert" : "status"}>
    <h1>{state.status === "loading" ? "Đang tải thông tin tour…" : state.status === "missing" ? "Không tìm thấy tour" : "Chưa thể tải thông tin tour"}</h1>
    {state.status === "error" && <button className="btn btn-primary" onClick={() => { setState({ status: "loading" }); setAttempt(v => v + 1); }}>Thử lại</button>}
    <Link href="/tours" className="btn btn-outline">Về danh sách tour</Link>
  </div></main>;

  const { tour, departures } = state.detail;
  const selected = departures.find(d => d.departureId === departureId);
  const price = selected ? selected.giaNguoiLonVnd : tour.giaNguoiLonVnd;
  const illustrationGallery = [tourIllustration(tour.diemDen), photos.hoian, photos.resort];
  const itinerary = tour.lichTrinhTomTat?.split(/\s+(?=Ngày\s+(?:\d+|cuối)\s*:)/u) || [];
  return <main id="main-content" className="page-main detail-page">
    <div className="container detail-breadcrumb"><Link href="/tours">Tour du lịch</Link><Icon name="chevron" size={14} /><span>{tour.tourId}</span></div>
    <div className="container detail-title"><div><span className="kicker">MÃ TOUR {tour.tourId} · {tour.loaiDuLieu || "Chưa phân loại"}</span><h1>{tour.tenTour || "Tour chưa có tên"}</h1><p><Icon name="map" size={17} />{tour.diemDen || "Chưa có điểm đến"}</p></div>
      <div className="detail-price"><small>Giá người lớn cơ bản</small><strong>{tourPrice(tour.giaNguoiLonVnd)}</strong><span>/ khách</span></div>
    </div>
    <figure className="container detail-illustration"><div className="tour-gallery">{illustrationGallery.map((src, i) => <img key={i} src={src} alt={"Ảnh du lịch minh họa " + (i + 1) + ", không phải ảnh riêng của tour"} />)}</div><figcaption>Toàn bộ ảnh chỉ mang tính minh họa, không đại diện cho điểm tham quan hoặc dịch vụ cụ thể của tour.</figcaption></figure>
    <div className="container detail-layout">
      <article className="detail-content">
        <div className="overview-strip"><span><Icon name="clock" /><small>Thời lượng</small><b>{tourDuration(tour)}</b></span><span><Icon name="plane" /><small>Khởi hành</small><b>{tour.diemKhoiHanh || "Chưa có thông tin"}</b></span><span><Icon name="bus" /><small>Phương tiện</small><b>{tour.phuongTien || "Chưa có thông tin"}</b></span></div>
        <section><h2>Điểm tham quan</h2><p>{tour.diemThamQuan || "Chưa có thông tin điểm tham quan."}</p></section>
        <section><h2>Lịch trình tóm tắt</h2>{itinerary.length ? <ol className="tour-timeline">{itinerary.map((part, i) => {
          const match = part.match(/^(Ngày\s+(?:\d+|cuối))\s*:\s*([\s\S]*)$/u);
          return <li key={i}>{match && <span className="tour-day">{match[1]}</span>}<p>{match ? match[2] : part}</p></li>;
        })}</ol> : <p>Chưa có thông tin lịch trình.</p>}</section>
        <section><h2>Giá tham khảo</h2><p>Người lớn: <b>{tourPrice(tour.giaNguoiLonVnd)}</b></p><p>Trẻ em: <b>{tourPrice(tour.giaTreEmVnd)}</b></p><p>Giá người lớn theo từng lịch được hiển thị bên dưới.</p></section>
        <section><h2>Lịch khởi hành</h2>
          {departures.length ? <div className="departure-table-wrap"><table className="departure-table"><caption>Lịch và số chỗ được trả về từ API</caption><thead><tr><th>Ngày</th><th>Giá người lớn</th><th>Số chỗ</th><th>Trạng thái</th></tr></thead><tbody>
            {departures.map(d => <tr key={d.departureId}><td>{tourDate(d.ngayKhoiHanh)}</td><td>{tourPrice(d.giaNguoiLonVnd)}</td><td>{d.soChoCon === null ? "Chưa có" : d.soChoCon}</td><td>{d.trangThai || "Chưa có"}</td></tr>)}
          </tbody></table></div> : <p>Chưa có lịch khởi hành.</p>}
        </section>
        <section><h2>Thông tin bổ sung</h2><p>Hệ thống chưa cung cấp chính sách hủy, dịch vụ bao gồm, quy định độ tuổi hoặc đánh giá cho tour này. Vui lòng xác nhận trước khi đặt dịch vụ.</p></section>
      </article>
      <aside className="detail-booking">
        <span className="kicker">THAM KHẢO LỊCH TOUR</span><h2>Chọn lịch khởi hành</h2>
        <label>Ngày khởi hành<select value={departureId} onChange={e => setDepartureId(e.target.value)}><option value="">Chọn lịch</option>{departures.map(d => <option key={d.departureId} value={d.departureId}>{tourDate(d.ngayKhoiHanh)} · {d.departureId}</option>)}</select></label>
        {selected && <><p>Số chỗ theo API: <b>{selected.soChoCon === null ? "Chưa có thông tin" : selected.soChoCon}</b></p><p>{selected.trangThai || "Chưa có trạng thái"}</p></>}
        <div className="detail-total"><span>Giá người lớn{selected && <small>Theo lịch đã chọn</small>}</span><strong>{tourPrice(price)}</strong></div>
        <button className="btn btn-primary detail-book-btn" disabled>Đặt tour — chưa khả dụng</button>
        <p className="tour-api-note">Demo giao diện: chưa có API booking. Không tạo đơn, giữ chỗ, trừ chỗ hoặc thanh toán. Số chỗ có thể thay đổi sau khi tải.</p>
      </aside>
    </div>
  </main>;
}
