"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { formatCurrency } from "@/lib/format";
import { roomIssue, stayParams } from "@/lib/hotel-stay";
import { getHotelImages } from "@/lib/media";
import { getHotel } from "@/services/hotels";
import type { HotelDetail, RoomType, Stay } from "@/types/hotel";
import { HotelFacilities } from "./HotelFacilities";
import { HotelHouseRules } from "./HotelHouseRules";
import { HotelOverview } from "./HotelOverview";
import { NearbyTours } from "./NearbyTours";
import { RoomTypeCard } from "./RoomTypeCard";
import { StayFields } from "./StayFields";

export function HotelDetailPage({ hotelId, initialStay }: { hotelId: string; initialStay: Stay }) {
  const { state, retry } = useResource(`hotel:${hotelId}`, signal => getHotel(hotelId, signal));
  return (
    <main id="main-content" className="sh-hotels">
      <div className="container sh-hotel-body">
        {state.status === "loading" && <LoadingState label="Đang tải thông tin khách sạn…" />}
        {state.status === "error" && (
          <ErrorState error={state.error} onRetry={retry} backHref="/hotels" backLabel="Danh sách khách sạn" />
        )}
        {state.status === "ready" && <HotelDetailContent detail={state.data} initialStay={initialStay} />}
      </div>
    </main>
  );
}

const SECTIONS = [
  { id: "hotel-overview", label: "Tổng quan" },
  { id: "hotel-rooms", label: "Phòng" },
  { id: "hotel-facilities", label: "Tiện nghi" },
  { id: "hotel-rules", label: "Chính sách" },
];

function HotelDetailContent({ detail, initialStay }: { detail: HotelDetail; initialStay: Stay }) {
  const { hotel, roomTypes, amenities, houseRules } = detail;
  const router = useRouter();
  const [stay, setStay] = useState(initialStay);
  const [error, setError] = useState<string | null>(null);
  const stayPanel = useRef<HTMLElement>(null);

  function selectRoom(room: RoomType) {
    const issue = roomIssue(room, stay);
    setError(issue);
    if (issue) {
      stayPanel.current?.querySelector("input")?.focus();
      return;
    }
    const params = stayParams(stay);
    params.set("roomType", room.id);
    router.push(`/hotels/${encodeURIComponent(hotel.id)}/booking?${params}`);
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Khách sạn", href: "/hotels?" + stayParams(stay) }, { label: hotel.name }]} />
      <div className="sh-hotel-detail-title">
        <div>
          {hotel.starRating !== null && <span className="sh-hotel-badge">{hotel.starRating} sao</span>}
          <h1>{hotel.name}</h1>
          <p><Icon name="map" size={17} />{hotel.address ?? hotel.city}</p>
        </div>
        <div className="detail-price">
          <small>Giá tham khảo từ</small><strong>{formatCurrency(hotel.referencePricePerNight)}</strong><span>/ đêm</span>
        </div>
      </div>
      <figure className="sh-hotel-gallery">
        <Gallery images={getHotelImages(hotel)} title={hotel.name} />
        <figcaption>Ảnh minh họa khu nghỉ, phòng và thành phố; đối tác chưa gửi ảnh riêng của khách sạn.</figcaption>
      </figure>
      <div className="sh-hotel-detail-layout">
        <div className="sh-hotel-detail-content">
          <nav className="hotel-section-nav" aria-label="Các phần của trang">
            {SECTIONS.map(section => <a key={section.id} href={"#" + section.id}>{section.label}</a>)}
          </nav>
          <HotelOverview hotel={hotel} amenities={amenities} houseRules={houseRules} />
          <section id="hotel-rooms" className="sh-hotel-panel">
            <h2>Chọn loại phòng</h2>
            <QuoteNotice service="hotel" />
            {roomTypes.length === 0
              ? <EmptyState title="Khách sạn chưa có loại phòng mở bán" />
              : roomTypes.map(room => <RoomTypeCard key={room.id} room={room} stay={stay} onSelect={selectRoom} />)}
          </section>
          <HotelFacilities amenities={amenities} />
          <HotelHouseRules rules={houseRules} />
          <NearbyTours city={hotel.city} />
        </div>
        <aside className="sh-hotel-panel sh-hotel-stay" ref={stayPanel} aria-label="Lịch lưu trú">
          <span className="kicker">LỊCH LƯU TRÚ</span>
          <h2>Bạn dự định nghỉ khi nào?</h2>
          <StayFields stay={stay} onChange={value => { setStay(value); setError(null); }} />
          {error && <p className="sh-hotel-error" role="alert">{error}</p>}
          <p className="sh-hotel-caption">Tạm tính = giá/đêm × số đêm × số phòng. Đối tác xác nhận giá cuối cùng.</p>
        </aside>
      </div>
    </>
  );
}
