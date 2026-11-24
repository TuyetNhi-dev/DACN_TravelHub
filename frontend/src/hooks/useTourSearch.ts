"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useResource, type Resource } from "@/hooks/useResource";
import type { Region } from "@/lib/departure-region";
import type { TourFilters } from "@/lib/tour-display";
import { departureDayParams, tourSearchParams } from "@/lib/tour-search";
import { getTourDepartureDays, searchTours } from "@/services/tours";
import type { TourDestination } from "@/types/tour";

const TYPING_DELAY_MS = 300;
/** Slider ceiling while the top price is unknown or when no tour is published. */
export const DEFAULT_PRICE_CEILING = 1_000_000;

/** The most expensive published tour, read once: the right end of the "Giá tối đa" slider. */
async function loadPriceCeiling(signal: AbortSignal): Promise<number> {
  const params = new URLSearchParams({ sort: "price_desc", page: "1", pageSize: "1" });
  const { items } = await searchTours(params, signal);
  return Math.max(DEFAULT_PRICE_CEILING, items[0]?.basePrice ?? 0);
}

/**
 * Results of /tours from the server (ROADMAP 8.1): filters, sort, departure region and page all go to
 * GET /api/tours. The text box waits until typing pauses; the other filters apply at once.
 */
export function useTourSearch(filters: TourFilters, region: Region, page: number,
  destinations: Resource<TourDestination[]>, calendarMonth: string) {
  const query = useDebouncedValue(filters.query, TYPING_DELAY_MS);
  const ceiling = useResource("tour-price-ceiling", loadPriceCeiling).state;
  const known = destinations.status === "ready" ? destinations.data : null;
  // A chosen destination name waits for the list so it can be sent as its id. If the list cannot be loaded the
  // search runs without it rather than never; the destination options then stay empty.
  const waiting = Boolean(filters.destination) && destinations.status === "loading";
  const destinationId = known?.find(item => item.name === filters.destination)?.id ?? null;
  const request = { filters: { ...filters, query }, region, destinationId };
  const params = tourSearchParams({ ...request, page });
  const { state, retry } = useResource(waiting ? null : `tours?${params}`, signal => searchTours(params, signal));
  return {
    state,
    retry,
    dayCounts: useDepartureDayCounts(waiting ? null : departureDayParams(request, calendarMonth)),
    destinationNames: known?.map(item => item.name) ?? [],
    priceCeiling: ceiling.status === "ready" ? ceiling.data : DEFAULT_PRICE_CEILING,
  };
}

/** Tours per departure day of the calendar's month, as a map for the date filter; null while loading. */
function useDepartureDayCounts(params: URLSearchParams | null) {
  // The loader only runs when the key is set, i.e. when params exist.
  const days = useResource(params ? `tour-days?${params}` : null,
    signal => (params ? getTourDepartureDays(params, signal) : Promise.resolve([]))).state;
  return {
    counts: days.status === "ready" ? new Map(days.data.map(day => [day.date, day.tourCount])) : null,
    failed: days.status === "error",
  };
}
