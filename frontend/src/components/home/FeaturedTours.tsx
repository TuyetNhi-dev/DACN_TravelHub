"use client";

import { useDeparture } from "@/components/departure/DepartureProvider";
import { Button } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { filterByDeparture, regionLabel } from "@/lib/departure-region";
import { useHomeTours } from "./HomeToursProvider";
import { TourCard } from "./TourCard";

const FEATURED_COUNT = 8;

export function FeaturedTours() {
  const { region, choose } = useDeparture();
  const { state, retry } = useHomeTours();
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.status === "loading" || region === null) return <CardSkeletons label="Đang tải tour nổi bật…" />;

  // The catalogue has no "featured" flag: show tours that still have open departures.
  const tours = filterByDeparture(state.data, region)
    .filter(tour => tour.upcomingDepartureDates.length > 0)
    .slice(0, FEATURED_COUNT);
  if (tours.length === 0) {
    return (
      <EmptyState title={`Chưa có tour mở bán khởi hành từ ${regionLabel(region)}`}>
        {region !== "all" && (
          <Button variant="outline" onClick={() => choose("all")}>Xem tất cả điểm khởi hành</Button>
        )}
      </EmptyState>
    );
  }
  return (
    <Carousel label="Tour nổi bật">
      {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
    </Carousel>
  );
}
