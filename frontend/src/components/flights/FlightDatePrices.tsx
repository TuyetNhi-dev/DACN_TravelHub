"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { flightSearchParams } from "@/lib/flight-search";
import type { FlightRoute, FlightSearch } from "@/types/flight";
import { PriceCalendar } from "./PriceCalendar";
import { PriceStrip } from "./PriceStrip";

interface FlightDatePricesProps {
  route: FlightRoute;
  search: FlightSearch;
}

/** The 7-day strip, with the whole-month calendar on demand; picking a day re-runs the search for it. */
export function FlightDatePrices({ route, search }: FlightDatePricesProps) {
  const router = useRouter();
  const [showMonth, setShowMonth] = useState(false);
  const pick = (date: string) => router.push("/flights?" + flightSearchParams({ ...search, date }));

  return (
    <div className="fp-dates">
      <PriceStrip route={route} selected={search.date} onPick={pick} />
      <button type="button" className="btn btn-outline fp-toggle" aria-expanded={showMonth}
        aria-controls="fp-month-panel" onClick={() => setShowMonth(value => !value)}>
        {showMonth ? "Ẩn lịch giá" : "Xem lịch cả tháng"}
      </button>
      <div id="fp-month-panel" hidden={!showMonth}>
        {showMonth && <PriceCalendar route={route} selected={search.date} onPick={pick} />}
      </div>
    </div>
  );
}
