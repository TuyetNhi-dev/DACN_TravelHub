"use client";

import { Carousel } from "@/components/ui/Carousel";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getUpcomingDepartures, SOON_DAYS } from "@/services/tours";
import { DepartureCard } from "./DepartureCard";

/** "Sắp khởi hành": bookable departures in the next SOON_DAYS days with their live seat counts. */
export function DepartingSoon() {
  const { state, retry } = useResource("home:departing-soon", getUpcomingDepartures);
  if (state.status === "loading") return <CardSkeletons label="Đang tải lịch khởi hành gần nhất…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.data.length === 0) return <EmptyState title={`Chưa có tour nào khởi hành trong ${SOON_DAYS} ngày tới`} />;
  return (
    <Carousel label="Tour sắp khởi hành">
      {state.data.map(departure => <DepartureCard key={departure.departureId} departure={departure} />)}
    </Carousel>
  );
}
