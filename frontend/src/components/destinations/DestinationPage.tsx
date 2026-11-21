"use client";

import { ListingHero } from "@/components/listing/ListingHero";
import { Gallery } from "@/components/ui/Gallery";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { cheapestFlightsTo, placeName, sameCity } from "@/lib/destinations";
import { formatCurrency } from "@/lib/format";
import { getDestinationImages } from "@/lib/media";
import { getUpcomingFlights } from "@/services/flights";
import { getHotels } from "@/services/hotels";
import { getTours } from "@/services/tours";
import type { FlightOffer } from "@/types/flight";
import type { HotelSummary } from "@/types/hotel";
import type { TourSummary } from "@/types/tour";
import { DestinationFlights, DestinationHotels, DestinationMore, DestinationTours } from "./DestinationSections";

const MAX_FLIGHTS = 6;

export interface PlaceServices {
  name: string;
  tours: TourSummary[];
  hotels: HotelSummary[];
  flights: FlightOffer[];
}

/** Everything SàiHành sells in one city: tours, hotels, flights there, seasonal ideas and offices. */
export function DestinationPage({ slug }: { slug: string }) {
  const tours = useResource("tours", getTours);
  const hotels = useResource("hotels", signal => getHotels({}, signal));
  const flights = useResource("flights:upcoming", getUpcomingFlights);
  const lists = {
    tours: tours.state.status === "ready" ? tours.state.data : [],
    hotels: hotels.state.status === "ready" ? hotels.state.data.items : [],
    flights: flights.state.status === "ready" ? flights.state.data : [],
  };
  const settled = [tours.state, hotels.state, flights.state].every(state => state.status !== "loading");
  const name = placeName(slug, [
    ...lists.tours.map(tour => tour.destination), ...lists.hotels.map(hotel => hotel.city),
    ...lists.flights.map(flight => flight.destinationCity),
  ]);

  if (!name) {
    return (
      <main id="main-content" className="listing-page">
        <div className="container destination-missing">
          {settled
            ? (
              <EmptyState title="Chưa có dịch vụ tại điểm đến này">
                Hãy xem các tour khác hoặc xem mục Trợ giúp để liên hệ tư vấn.
              </EmptyState>
            )
            : <CardSkeletons count={3} label="Đang tải thông tin điểm đến…" />}
        </div>
      </main>
    );
  }
  const place: PlaceServices = {
    name,
    tours: lists.tours.filter(tour => sameCity(tour.destination, name)),
    hotels: lists.hotels.filter(hotel => sameCity(hotel.city, name)),
    flights: cheapestFlightsTo(lists.flights, name, MAX_FLIGHTS),
  };
  return <DestinationContent place={place} loading={!settled} />;
}

function DestinationContent({ place, loading }: { place: PlaceServices; loading: boolean }) {
  const images = getDestinationImages(place.name);
  const cheapest = place.flights[0]?.referencePrice ?? null;
  return (
    <main id="main-content" className="listing-page destination-page">
      <ListingHero crumbs={[{ label: "Trang chủ", href: "/" }, { label: place.name }]} eyebrow="Điểm đến"
        title={`Du lịch ${place.name}`} image={images[0]}
        description={`Tour, khách sạn và vé máy bay SàiHành có ở ${place.name}, gom lại một nơi.`}>
        <span><strong>{place.tours.length}</strong> tour</span>
        <span><strong>{place.hotels.length}</strong> khách sạn</span>
        {cheapest !== null && <span>Vé máy bay từ <strong>{formatCurrency(cheapest)}</strong></span>}
      </ListingHero>
      <div className="container destination-body">
        <nav className="hotel-section-nav" aria-label="Các phần của trang">
          <a href="#destination-tours">Tour</a>
          <a href="#destination-hotels">Khách sạn</a>
          <a href="#destination-flights">Vé máy bay</a>
          <a href="#destination-photos">Hình ảnh</a>
          <a href="#destination-more">Theo mùa & văn phòng</a>
        </nav>
        {loading && <p className="listing-note" role="status">Đang tải thêm dịch vụ…</p>}
        <DestinationTours place={place} />
        <DestinationHotels place={place} />
        <DestinationFlights place={place} />
        <section id="destination-photos" className="destination-section" aria-labelledby="photos-title">
          <h2 id="photos-title">Hình ảnh {place.name}</h2>
          <Gallery images={images} title={place.name} />
        </section>
        <DestinationMore place={place} />
      </div>
    </main>
  );
}
