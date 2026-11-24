"use client";

import Link from "next/link";
import { Card, MediaFrame } from "@/components/ui/Card";
import { Carousel } from "@/components/ui/Carousel";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { StarRating } from "@/components/ui/Rating";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getHotelImages } from "@/lib/media";
import { getHomeHotels } from "@/services/home-catalog";
import type { HotelSummary } from "@/types/hotel";
import { TOUR_CARD_SIZES } from "./TourCard";

const SKELETON_COUNT = 4;

/** Same slide width and 4:3 photo as the tour cards, so every home carousel lines up. */
function HotelTile({ hotel }: { hotel: HotelSummary }) {
  return (
    <Card className="hotel-tile">
      <MediaFrame image={getHotelImages(hotel)[0]} sizes={TOUR_CARD_SIZES} />
      <div className="hotel-tile-body">
        <StarRating stars={hotel.starRating} />
        <h3>
          <Link className="ui-stretched" href={"/hotels/" + encodeURIComponent(hotel.id)}>{hotel.name}</Link>
        </h3>
        <span className="hotel-tile-city"><Icon name="map" size={14} />{hotel.city}</span>
        <PriceTag prefix="Giá từ" amount={hotel.referencePricePerNight} unit="/ đêm" quote />
      </div>
    </Card>
  );
}

export function HotelHighlights() {
  const { state, retry } = useResource("home:hotels", getHomeHotels);
  if (state.status === "loading") return <CardSkeletons count={SKELETON_COUNT} label="Đang tải khách sạn…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.data.length === 0) return <EmptyState title="Chưa có báo giá khách sạn từ đối tác" />;
  return (
    <Carousel label="Khách sạn nổi bật">
      {state.data.map(hotel => <HotelTile key={hotel.id} hotel={hotel} />)}
    </Carousel>
  );
}
