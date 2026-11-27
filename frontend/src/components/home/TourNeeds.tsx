"use client";

import { useState } from "react";
import { Carousel } from "@/components/ui/Carousel";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Tabs } from "@/components/ui/Tabs";
import { TOUR_GROUPS, toursInGroup, type TourGroupId } from "@/lib/tour-groups";
import { useHomeTours } from "./HomeToursProvider";
import { TourCard } from "./TourCard";

const TOURS_PER_TAB = 8;

export function TourNeeds() {
  const [active, setActive] = useState<TourGroupId>(TOUR_GROUPS[0].id);
  return (
    <div className="tour-needs">
      <Tabs idPrefix="need" label="Chọn nhu cầu chuyến đi" tabs={TOUR_GROUPS} active={active} onChange={setActive}>
        <NeedPanel group={active} />
      </Tabs>
    </div>
  );
}

function NeedPanel({ group }: { group: TourGroupId }) {
  const { state, retry } = useHomeTours();
  if (state.status === "loading") return <CardSkeletons label="Đang tải tour…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  const tours = toursInGroup(state.data, group, TOURS_PER_TAB);
  if (tours.length === 0) return <EmptyState title="Chưa có tour phù hợp nhóm này" />;
  return (
    <Carousel key={group} label="Tour theo nhu cầu">
      {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
    </Carousel>
  );
}
