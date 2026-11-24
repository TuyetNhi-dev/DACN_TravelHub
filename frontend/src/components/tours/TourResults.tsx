"use client";

import { useState } from "react";
import { filterByDeparture, hasUnknownRegion, type Region } from "@/lib/departure-region";
import { monthOf } from "@/lib/flight-calendar";
import { vietnamToday } from "@/lib/format";
import { destinationsOf, filterTours, type TourFilters } from "@/lib/tour-display";
import { countByDepartureDay, TOUR_PAGE_SIZE, tourPageCount } from "@/lib/tour-search";
import type { TourSummary } from "@/types/tour";
import { TourResultsView } from "./TourResultsView";

const MIN_PRICE_CEILING = 1_000_000;
const UNKNOWN_REGION_NOTE = "Một số tour chưa xác định được vùng khởi hành. Chọn “Xem tất cả” để không bỏ sót.";

interface TourResultsProps {
  tours: TourSummary[];
  region: Region;
  initialFilters: TourFilters;
  showAll: () => void;
}

/**
 * A seasonal collection: a short, hand-picked list already in the page, so it is filtered here. The full
 * catalogue on /tours is filtered by the server instead (TourSearchResults).
 */
export function TourResults({ tours, region, initialFilters, showAll }: TourResultsProps) {
  const [filters, setFilters] = useState<TourFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => monthOf(initialFilters.date || vietnamToday()));
  const inRegion = filterByDeparture(tours, region);
  const rows = filterTours(inRegion, filters);
  const pageCount = tourPageCount(rows.length);
  const currentPage = Math.min(page, pageCount);
  // Day counts follow every filter except the day itself, like the server's departure-days answer.
  const counts = countByDepartureDay(filterTours(inRegion, { ...filters, date: "" }), calendarMonth);
  return (
    <TourResultsView filters={filters} onFiltersChange={next => { setFilters(next); setPage(1); }}
      results={{
        status: "ready", total: rows.length, pageCount,
        rows: rows.slice((currentPage - 1) * TOUR_PAGE_SIZE, currentPage * TOUR_PAGE_SIZE),
      }}
      page={currentPage} onPage={setPage} destinations={destinationsOf(tours)}
      priceCeiling={Math.max(MIN_PRICE_CEILING, ...tours.map(tour => tour.basePrice))}
      region={region} showAll={showAll}
      dateFilter={{ month: calendarMonth, onMonthChange: setCalendarMonth, counts, failed: false }}
      note={region !== "all" && hasUnknownRegion(tours) ? UNKNOWN_REGION_NOTE : undefined} />
  );
}
