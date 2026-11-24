"use client";

import { useState } from "react";
import type { Resource } from "@/hooks/useResource";
import { useTourSearch } from "@/hooks/useTourSearch";
import type { Region } from "@/lib/departure-region";
import type { TourFilters } from "@/lib/tour-display";
import { monthOf } from "@/lib/flight-calendar";
import { vietnamToday } from "@/lib/format";
import { tourPageCount } from "@/lib/tour-search";
import type { TourDestination } from "@/types/tour";
import { TourResultsView, type TourResultsState } from "./TourResultsView";

interface TourSearchResultsProps {
  region: Region;
  initialFilters: TourFilters;
  showAll: () => void;
  /** Loaded once by the page, which also counts the published tours from it. */
  destinations: Resource<TourDestination[]>;
}

/** The full catalogue on /tours: every filter, the sort, the departure region and the page are the server's job. */
export function TourSearchResults({ region, initialFilters, showAll, destinations }: TourSearchResultsProps) {
  const [filters, setFilters] = useState<TourFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => monthOf(initialFilters.date || vietnamToday()));
  const { state, retry, dayCounts, destinationNames, priceCeiling } =
    useTourSearch(filters, region, page, destinations, calendarMonth);
  const results: TourResultsState = state.status === "ready"
    ? { status: "ready", rows: state.data.items, total: state.data.total, pageCount: tourPageCount(state.data.total) }
    : state.status === "error" ? { status: "error", error: state.error, retry } : { status: "loading" };
  return (
    <TourResultsView filters={filters} onFiltersChange={next => { setFilters(next); setPage(1); }}
      results={results} page={page} onPage={setPage} destinations={destinationNames}
      priceCeiling={priceCeiling} region={region} showAll={showAll}
      dateFilter={{ month: calendarMonth, onMonthChange: setCalendarMonth, ...dayCounts }} />
  );
}
