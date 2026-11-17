"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { TOUR_GROUPS, toursInGroup, type TourGroupId } from "@/lib/tour-groups";
import { useHomeTours } from "./HomeToursProvider";
import { TourCard } from "./TourCard";

const TOURS_PER_TAB = 3;

/** WAI-ARIA tabs: arrow keys move between tabs, only the active tab is in the tab order. */
export function TourNeeds() {
  const [active, setActive] = useState<TourGroupId>(TOUR_GROUPS[0].id);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    const current = TOUR_GROUPS.findIndex(group => group.id === active);
    const next = (current + step + TOUR_GROUPS.length) % TOUR_GROUPS.length;
    setActive(TOUR_GROUPS[next].id);
    tabs.current[next]?.focus();
  }

  return (
    <div className="tour-needs">
      <div className="ui-tabs" role="tablist" aria-label="Chọn nhu cầu chuyến đi" onKeyDown={onKeyDown}>
        {TOUR_GROUPS.map((group, index) => (
          <button key={group.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab"
            id={`need-tab-${group.id}`} aria-controls="need-panel" aria-selected={active === group.id}
            tabIndex={active === group.id ? 0 : -1} onClick={() => setActive(group.id)}>
            {group.label}
          </button>
        ))}
      </div>
      <div id="need-panel" role="tabpanel" aria-labelledby={`need-tab-${active}`}>
        <NeedPanel group={active} />
      </div>
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
    <div className="tour-grid-3" key={group}>
      {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
    </div>
  );
}
