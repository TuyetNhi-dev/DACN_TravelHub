"use client";

import Link from "next/link";
import { DealNotice } from "@/components/flights/DealBadges";
import { FlightDealCard } from "@/components/flights/FlightDealCard";
import { Carousel } from "@/components/ui/Carousel";
import { Icon } from "@/components/ui/Icon";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getFlightDeals } from "@/services/flights";

const HOME_DEALS = 8;
const ALL_ORIGINS = "";

/** "Săn deal vé": the first few route deals from SàiHành's own seat allotment (confirmed on payment). */
export function HomeFlightDeals() {
  const { state, retry } = useResource("home:flight-deals", signal => getFlightDeals(ALL_ORIGINS, signal));
  if (state.status === "loading") return <CardSkeletons label="Đang tìm vé deal…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.data.length === 0) return <NoDealsNote />;
  return (
    <>
      <DealNotice />
      <div className="home-deals">
        <Carousel label="Vé deal">
          {state.data.slice(0, HOME_DEALS).map(deal => (
            <FlightDealCard key={deal.offerId} deal={deal} headingLevel={3} />
          ))}
        </Carousel>
      </div>
    </>
  );
}

/** Empty state kept to one line: the home page is a teaser, and flight search still covers every route. */
function NoDealsNote() {
  return (
    <p className="home-deals-empty" role="status">
      <span><Icon name="plane" size={18} />Hiện chưa có vé deal trong 30 ngày tới.</span>
      <Link className="ui-view-all" href="/flights">
        Tìm vé theo hành trình <Icon name="arrow" size={16} />
      </Link>
    </p>
  );
}
