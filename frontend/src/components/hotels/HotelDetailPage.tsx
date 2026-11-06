/* eslint-disable @next/next/no-img-element -- API contains no hotel/room photographs; every image is labelled as illustration. */
"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { photos } from "@/data/home";
import { tourIllustration } from "@/lib/tour-display";
import { formatCurrency } from "@/lib/format";
import { roomBookingIssue, splitAmenities, stayNights, stayParams, stayTotal, validateStay } from "@/lib/hotel-stay";
import { Icon } from "@/components/ui/Icon";
import { HotelBreadcrumb, HotelSourceNotice, HotelStatus, StayFields, useHotelResource } from "./hotel-shared";
import type { HotelDetail, HotelRoom, HotelSource, Stay } from "@/types/hotel";

interface HotelDetailProps {
  hotelId: string;
  source: HotelSource;
  initialStay: Stay;
}

export function HotelDetailPage({ hotelId, source, initialStay }: HotelDetailProps) {
  const { state, retry } = useHotelResource(source, hotelId);

  return (
    <main id="main-content" className="sh-hotels">
      <div className="container sh-hotel-body">
        <HotelBreadcrumb title="Chi tiết khách sạn" source={source} />
        <HotelSourceNotice source={source} stay={initialStay} />
        {state.status !== "ready" && <HotelStatus status={state.status} retry={retry} />}
        {state.status === "ready" && state.detail && (
          <HotelDetailContent detail={state.detail} source={source} initialStay={initialStay} />
        )}
      </div>
    </main>
  );
}

function HotelDetailContent({ detail: { hotel, rooms }, source, initialStay }: {
  detail: HotelDetail;
  source: HotelSource;
  initialStay: Stay;
}) {
  const [stay, setStay] = useState(initialStay);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const staySection = useRef<HTMLElement>(null);
  const router = useRouter();
  const images = [...new Set([tourIllustration(hotel.thanhPho), photos.resort, photos.hero, photos.hoian])];
  const amenities = splitAmenities(hotel.tienNghi);
  const nights = stayNights(stay);
  const listHref = "/hotels?" + stayParams(stay, source);

  function selectRoom(room: HotelRoom) {
    const issue = roomBookingIssue(room, stay);
    setError(issue);
    if (issue) {
      staySection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      staySection.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }

    const params = stayParams(stay, source);
    params.set("room", room.roomId);
    router.push("/hotels/" + encodeURIComponent(hotel.hotelId) + "/booking?" + params);
  }

  function applyStay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateStay(stay);
    setError(issue);
    if (issue) return;

    const href = "/hotels/" + encodeURIComponent(hotel.hotelId) + "?" + stayParams(stay, source);
    window.history.replaceState(null, "", href);
    document.getElementById("hotel-rooms")?.scrollIntoView({ behavior: "smooth" });
  }

  function changeStay(value: Stay) {
    setStay(value);
    setError(null);
  }

  return (
    <>
      <div className="sh-hotel-detail-title">
        <div>
          <span className="sh-hotel-badge">
            {hotel.hangSaoDemo !== null ? hotel.hangSaoDemo + " sao · Hạng sao demo" : "Lưu trú trong nước"}
          </span>
          <h1>{hotel.tenKhachSan || "Khách sạn chưa có tên"}</h1>
          <p><Icon name="map" size={17} />{hotel.diaChi || hotel.thanhPho || "Địa chỉ đang cập nhật"}</p>
        </div>
        <a className="btn btn-primary" href="#hotel-rooms">Khám phá các loại phòng <Icon name="arrow" size={17} /></a>
      </div>

      <figure className="sh-hotel-gallery">
        <div className="sh-hotel-gallery-main">
          <img
            src={images[imageIndex]}
            alt={"Ảnh du lịch minh họa " + (imageIndex + 1) + ", không phải ảnh của khách sạn"}
            width={1200}
            height={600}
            fetchPriority="high"
          />
          <span className="sh-hotel-image-label">Ảnh minh họa · {imageIndex + 1}/{images.length}</span>
        </div>
        <div className="sh-hotel-thumbnails" aria-label="Chọn ảnh minh họa">
          {images.map((image, index) => (
            <button
              type="button"
              key={image}
              aria-label={"Xem ảnh minh họa " + (index + 1)}
              aria-pressed={imageIndex === index}
              onClick={() => setImageIndex(index)}
            >
              <img src={image} alt="" width={240} height={140} loading="lazy" />
            </button>
          ))}
        </div>
        <figcaption>API chưa cung cấp album khách sạn hoặc ảnh loại phòng. Các ảnh trên chỉ minh họa không gian du lịch.</figcaption>
      </figure>

      <nav className="sh-hotel-section-nav" aria-label="Nội dung khách sạn">
        <a href="#hotel-overview">Tổng quan</a>
        <a href="#hotel-rooms">Loại phòng</a>
        <a href="#hotel-amenities">Tiện nghi</a>
        <a href="#hotel-policies">Chính sách</a>
      </nav>

      <div className="sh-hotel-detail-layout">
        <div className="sh-hotel-detail-content">
          <section className="sh-hotel-panel" id="hotel-overview">
            <span className="kicker">ĐIỂM DỪNG CHÂN CỦA BẠN</span>
            <h2>Về nơi lưu trú</h2>
            <p>{hotel.ghiChu || "Chưa có thông tin giới thiệu chi tiết từ nguồn dữ liệu."}</p>
            <p className="sh-hotel-caption">Nguồn tham khảo: {hotel.nguonThamKhao || "Chưa được cung cấp"}</p>
            <div className="sh-hotel-overview">
              <span><Icon name="map" /><b>{hotel.thanhPho || "Chưa có thành phố"}</b><small>Điểm đến</small></span>
              <span><Icon name="hotel" /><b>{rooms.length} loại phòng</b><small>Trong danh mục</small></span>
              <span><Icon name="wallet" /><b>{formatCurrency(hotel.giaTuVndDem)}</b><small>Giá từ / đêm, tham khảo</small></span>
            </div>
          </section>

          <section id="hotel-rooms" className="sh-hotel-panel">
            <div className="sh-hotel-section-heading">
              <div><span className="kicker">NGHỈ NGƠI THEO CÁCH CỦA BẠN</span><h2>Chọn loại phòng</h2></div>
              {nights > 0 && <span className="sh-hotel-badge">{nights} đêm · {stay.guests} khách · {stay.rooms} phòng</span>}
            </div>
            <p className="sh-hotel-caption">
              Số phòng là giá trị tham khảo từ danh mục, chưa được kiểm tra theo ngày lưu trú.
              Chọn phòng để trải nghiệm đặt phòng demo.
            </p>
            {rooms.length === 0 && (
              <div className="sh-hotel-empty">
                <h3>Chưa có loại phòng</h3>
                <p>Khách sạn này chưa có dữ liệu phòng. Bạn có thể chọn khách sạn khác.</p>
                <Link className="btn btn-outline" href={listHref}>Tìm nơi lưu trú khác</Link>
              </div>
            )}
            {rooms.map(room => <RoomCard key={room.roomId} room={room} stay={stay} onSelect={selectRoom} />)}
          </section>

          <section id="hotel-amenities" className="sh-hotel-panel">
            <h2>Tiện nghi khách sạn</h2>
            {amenities.length > 0 ? (
              <ul className="sh-hotel-amenities">
                {amenities.map((item, index) => <li key={index}><Icon name="check" size={17} />{item}</li>)}
              </ul>
            ) : <p>Chưa có thông tin tiện nghi từ hệ thống.</p>}
          </section>

          <section id="hotel-policies" className="sh-hotel-panel">
            <h2>Chính sách lưu trú</h2>
            {source === "demo" ? (
              <>
                <span className="sh-hotel-badge">Điều kiện minh họa cho bản demo</span>
                <ul>
                  <li>Giờ nhận phòng minh họa: từ 14:00; trả phòng trước 12:00.</li>
                  <li>Không thu tiền, không giữ phòng hoặc gửi xác nhận qua email.</li>
                  <li>Không áp dụng chính sách hoàn/hủy thực tế vì không có giao dịch được tạo.</li>
                </ul>
              </>
            ) : (
              <p>
                API chưa cung cấp giờ nhận/trả phòng, điều kiện hủy, phụ thu và chính sách trẻ em.
                Cần xác nhận với nơi lưu trú trước khi đặt thật. Không suy đoán các điều kiện này từ giá phòng.
              </p>
            )}
          </section>

          <section className="sh-hotel-panel">
            <h2>Đánh giá từ khách lưu trú</h2>
            <p>Chưa có nguồn đánh giá trong hệ thống. Chưa đủ dữ liệu để hiển thị điểm đánh giá hoặc tóm tắt nhận xét.</p>
          </section>
        </div>

        <aside className="sh-hotel-panel sh-hotel-stay" ref={staySection} aria-label="Chọn lịch lưu trú">
          <span className="kicker">LỊCH LƯU TRÚ CỦA BẠN</span>
          <h2>Bạn dự định nghỉ khi nào?</h2>
          <form onSubmit={applyStay}>
            <StayFields stay={stay} onChange={changeStay} />
            {error && <p className="sh-hotel-error" role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit">Áp dụng lịch lưu trú</button>
          </form>
          <p className="sh-hotel-caption">
            Tối đa 30 đêm. Tổng demo = giá phòng × số đêm × số phòng.
            Thuế/phí chưa được cung cấp sẽ không tự cộng thêm.
          </p>
          <div className="sh-hotel-callout">
            <Icon name="shield" size={20} />
            <p>Đặt phòng mô phỏng. Không thanh toán, không giữ chỗ và không bảo đảm phòng còn trống.</p>
          </div>
          <Link href={listHref} className="view-all">Xem khách sạn khác <Icon name="arrow" size={16} /></Link>
        </aside>
      </div>
    </>
  );
}

function RoomCard({ room, stay, onSelect }: { room: HotelRoom; stay: Stay; onSelect: (room: HotelRoom) => void }) {
  const nights = stayNights(stay);
  let unavailableReason: string | null = null;
  if (room.soPhongCon === 0) {
    unavailableReason = "Danh mục ghi nhận hết phòng";
  } else if (room.giaVndDem === null || !room.sucChua) {
    unavailableReason = "Chưa đủ thông tin để đặt demo";
  }

  return (
    <article className="sh-hotel-room">
      <div>
        <span className="sh-hotel-badge">{room.loaiDuLieu || "Chưa phân loại dữ liệu phòng"}</span>
        <h3>{room.loaiPhong || "Loại phòng chưa có tên"}</h3>
        <p>
          <Icon name="users" size={16} />
          {room.sucChua === null ? "Chưa có sức chứa" : "Tối đa " + room.sucChua + " khách / phòng"}
        </p>
        <p className="sh-hotel-caption">
          {room.soPhongCon === null ? "Chưa có số lượng phòng tham khảo" : "Số phòng tham khảo trong danh mục: " + room.soPhongCon}
        </p>
        <details>
          <summary>Thông tin loại phòng</summary>
          <p>
            Mã phòng: {room.roomId}. Diện tích, loại giường chi tiết và tiện nghi riêng của phòng chưa được cung cấp;
            tiện nghi khách sạn được trình bày ở mục bên dưới.
          </p>
        </details>
      </div>
      <div className="sh-hotel-room-price">
        <small>Giá phòng / đêm</small>
        <strong>{formatCurrency(room.giaVndDem)}</strong>
        {nights > 0 && <p>{formatCurrency(stayTotal(room, stay))} / {nights} đêm × {stay.rooms} phòng</p>}
        {unavailableReason ? (
          <span className="sh-hotel-unavailable">{unavailableReason}</span>
        ) : (
          <button className="btn btn-primary" onClick={() => onSelect(room)}>Chọn phòng · Demo</button>
        )}
      </div>
    </article>
  );
}
