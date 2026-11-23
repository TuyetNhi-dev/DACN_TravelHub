"use client";

import { useState } from "react";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { Button } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Tabs } from "@/components/ui/Tabs";
import { filterByDeparture, regionLabel } from "@/lib/departure-region";
import { destinationTabsFor, packageTours, type DestinationTabId } from "@/lib/destination-region";
import { useHomeTours } from "./HomeToursProvider";
import { TourCard } from "./TourCard";

const TOURS_PER_TAB = 8;

/** "Tour trọn gói": open tours from the chosen departure city, tabbed by destination region. */
export function FeaturedTours() {
  const { region, choose } = useDeparture();
  const { state, retry } = useHomeTours();
  const [tab, setTab] = useState<DestinationTabId>("all");
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.status === "loading" || region === null) return <CardSkeletons label="Đang tải tour trọn gói…" />;

  // The catalogue has no "featured" flag: show tours that still have open departures.
  const open = packageTours(filterByDeparture(state.data, region), "all", Number.POSITIVE_INFINITY);
  if (open.length === 0) {
    return (
      <EmptyState title={`Chưa có tour mở bán khởi hành từ ${regionLabel(region)}`}>
        {region !== "all" && (
          <Button variant="outline" onClick={() => choose("all")}>Xem tất cả điểm khởi hành</Button>
        )}
      </EmptyState>
    );
  }
  const tabs = destinationTabsFor(open);
  // Changing the departure city can remove the selected region; fall back to "Tất cả" instead of an empty tab.
  const active = tabs.some(item => item.id === tab) ? tab : "all";
  return (
    <Tabs idPrefix="package" label="Lọc tour theo vùng điểm đến" tabs={tabs} active={active} onChange={setTab}>
      <Carousel key={active} label="Tour trọn gói">
        {packageTours(open, active, TOURS_PER_TAB).map(tour => (
          <TourCard key={tour.id} tour={tour} showDepartureDates />
        ))}
      </Carousel>
    </Tabs>
  );
}
