"use client";

import { DealNotice } from "@/components/flights/DealBadges";
import { FlightDealCard } from "@/components/flights/FlightDealCard";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getFlightDeals } from "@/services/flights";

const HOME_DEALS = 3;
const ALL_ORIGINS = "";

/** "Săn deal vé": the first few route deals from SàiHành's own seat allotment (confirmed on payment). */
export function HomeFlightDeals() {
  const { state, retry } = useResource("home:flight-deals", signal => getFlightDeals(ALL_ORIGINS, signal));
  if (state.status === "loading") return <CardSkeletons label="Đang tìm vé deal…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.data.length === 0) return <EmptyState title="Chưa có vé deal trong 30 ngày tới" icon="plane" />;
  return (
    <>
      <DealNotice />
      <div className="home-deals">
        {state.data.slice(0, HOME_DEALS).map(deal => (
          <div key={deal.offerId} data-reveal-item><FlightDealCard deal={deal} headingLevel={3} /></div>
        ))}
      </div>
    </>
  );
}
