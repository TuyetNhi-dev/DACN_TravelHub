"use client";

import Link from "next/link";
import { airportCode, airportLabel, flightSearchParams } from "@/lib/flight-search";
import { formatDate } from "@/lib/format";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlightDatePrices } from "./FlightDatePrices";
import { FlightLegOffers } from "./FlightList";
import { RoundTripResults } from "./RoundTripResults";

export function FlightResults({ search }: { search: FlightSearch }) {
  if (search.returnDate) return <RoundTripResults search={search} />;
  const route = { from: airportCode(search.from), to: airportCode(search.to), cabin: search.cabin };
  return (
    <section aria-label="Kết quả chuyến bay">
      <div className="sf-results-title">
        <div>
          <span className="kicker">CHUYẾN BAY MỘT CHIỀU</span>
          <h2>{airportLabel(route.from)} → {airportLabel(route.to)}</h2>
          <p>{formatDate(search.date)} · {search.passengers} hành khách</p>
        </div>
      </div>
      <FlightDatePrices route={route} search={search} />
      <FlightLegOffers search={search} renderAction={offer => (
        <Link className="btn btn-primary" href={bookingHref(search, offer)}>Chọn chuyến</Link>
      )} />
    </section>
  );
}

function bookingHref(search: FlightSearch, offer: FlightOffer): string {
  const params = flightSearchParams(search);
  params.set("offer", offer.offerId);
  return "/flights/booking?" + params;
}
