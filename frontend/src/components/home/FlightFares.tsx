"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { cabinLabel, flightDay, flightSearchParams } from "@/lib/flight-search";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { getHomeFlights } from "@/services/home-catalog";
import type { FlightOffer } from "@/types/flight";

const SKELETON_COUNT = 3;

function fareHref(flight: FlightOffer): string {
  return "/flights?" + flightSearchParams({
    from: flight.originCode, to: flight.destinationCode, date: flightDay(flight), passengers: 1,
    cabin: flight.cabinClass,
  });
}

export function FareCard({ flight }: { flight: FlightOffer }) {
  return (
    <article className="fare-card ui-card">
      <div className="fare-route">
        <span><b>{flight.originCode}</b><small>{flight.originCity}</small></span>
        <span className="fare-line" aria-hidden="true"><Icon name="plane" size={16} /></span>
        <span><b>{flight.destinationCode}</b><small>{flight.destinationCity}</small></span>
      </div>
      <p className="fare-meta">
        {flight.airline} · {flight.flightNumber} · {cabinLabel(flight.cabinClass)}
        <br />
        {formatDate(flightDay(flight))} · {formatTime(flight.departAt)} · {formatDuration(flight.durationMinutes)}
      </p>
      <div className="fare-foot">
        <PriceTag amount={flight.referencePrice} unit="/ khách" quote />
        <Link className="ui-stretched fare-go" href={fareHref(flight)}
          aria-label={`Xem chuyến bay ${flight.originCity} đến ${flight.destinationCity}`}>
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </article>
  );
}

export function FlightFares() {
  const { state, retry } = useResource("home:flights", getHomeFlights);
  if (state.status === "loading") {
    return (
      <div className="fare-grid" role="status" aria-busy="true">
        <span className="sr-only">Đang tải giá vé…</span>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Skeleton key={index} className="ui-skeleton--fare" />
        ))}
      </div>
    );
  }
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;
  if (state.data.length === 0) return <EmptyState title="Chưa có báo giá vé máy bay từ đối tác" />;
  return (
    <div className="fare-grid">
      {state.data.map(flight => <FareCard key={flight.offerId} flight={flight} />)}
    </div>
  );
}
