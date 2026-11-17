"use client";

import Link from "next/link";
import { FareCard } from "@/components/home/FlightFares";
import { TourCard } from "@/components/home/TourCard";
import { HotelCard } from "@/components/hotels/HotelCard";
import { CollectionStrip } from "@/components/tours/CollectionStrip";
import { Icon } from "@/components/ui/Icon";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useResource } from "@/hooks/useResource";
import { defaultStay } from "@/lib/hotel-stay";
import { getTourCollections } from "@/services/tours";
import type { PlaceServices } from "./DestinationPage";

const MAX_TOURS = 6;
const MAX_HOTELS = 3;

export function DestinationTours({ place }: { place: PlaceServices }) {
  const query = encodeURIComponent(place.name);
  return (
    <section id="destination-tours" className="destination-section" aria-labelledby="dest-tours-title">
      <SectionHeader id="dest-tours-title" eyebrow="Tour trọn gói" title={`Tour đến ${place.name}`}
        description="Tour SàiHành điều hành: giữ chỗ ngay khi đặt."
        link={place.tours.length > MAX_TOURS ? { href: `/tours?q=${query}`, label: "Xem tất cả tour" } : undefined} />
      {place.tours.length === 0
        ? <p className="listing-note">Chưa có tour mở bán tới {place.name}. Xem các tour theo mùa bên dưới.</p>
        : (
          <div className="listing-grid">
            {place.tours.slice(0, MAX_TOURS).map(tour => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
    </section>
  );
}

export function DestinationHotels({ place }: { place: PlaceServices }) {
  const stay = defaultStay();
  return (
    <section id="destination-hotels" className="destination-section" aria-labelledby="dest-hotels-title">
      <SectionHeader id="dest-hotels-title" eyebrow="Lưu trú" title={`Khách sạn tại ${place.name}`}
        link={{ href: `/hotels?q=${encodeURIComponent(place.name)}`, label: "Tìm khách sạn" }} />
      {place.hotels.length === 0
        ? <p className="listing-note">Chưa có khách sạn đối tác tại {place.name}.</p>
        : (
          <>
            <QuoteNotice service="hotel" />
            <div className="destination-hotels">
              {place.hotels.slice(0, MAX_HOTELS).map(hotel => <HotelCard key={hotel.id} hotel={hotel} stay={stay} />)}
            </div>
          </>
        )}
    </section>
  );
}

export function DestinationFlights({ place }: { place: PlaceServices }) {
  return (
    <section id="destination-flights" className="destination-section" aria-labelledby="dest-flights-title">
      <SectionHeader id="dest-flights-title" eyebrow="Vé máy bay" title={`Bay đến ${place.name}`}
        description="Giá rẻ nhất từ mỗi sân bay trong danh mục đối tác."
        link={{ href: "/flights", label: "Tìm chuyến bay" }} />
      {place.flights.length === 0
        ? <p className="listing-note">Chưa có báo giá chuyến bay tới {place.name}.</p>
        : <div className="fare-grid">{place.flights.map(f => <FareCard key={f.offerId} flight={f} />)}</div>}
    </section>
  );
}

export function DestinationMore({ place }: { place: PlaceServices }) {
  const { state } = useResource("tour-collections", getTourCollections);
  return (
    <section id="destination-more" className="destination-section" aria-labelledby="dest-more-title">
      <SectionHeader id="dest-more-title" eyebrow="Gợi ý thêm" title="Tour theo mùa & hỗ trợ"
        description={`Chưa chốt ngày đi ${place.name}? Xem các mùa đẹp trong năm.`} />
      {state.status === "ready" && <CollectionStrip collections={state.data} />}
      <Link href="/branches" className="destination-office">
        <span aria-hidden="true"><Icon name="map" /></span>
        <span><strong>Ghé văn phòng SàiHành</strong><small>Tư vấn trực tiếp lịch trình, giá và giấy tờ.</small></span>
        <Icon name="arrow" size={18} />
      </Link>
    </section>
  );
}
