/** Pure mapping of the /tours filters onto GET /api/tours (ROADMAP 8.1): the server filters, sorts and pages. */
import type { Region } from "@/lib/departure-region";
import { durationRange, type PriceSort, type TourFilters } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";

export const TOUR_PAGE_SIZE = 9;
/** Mirrors TourSearchRules.MaxQueryLength: a longer text would be refused with 400. */
export const MAX_QUERY_LENGTH = 100;

const SORTS: Record<Exclude<PriceSort, "">, string> = { low: "price_asc", high: "price_desc" };

export interface TourSearchRequest {
  filters: TourFilters;
  region: Region;
  page: number;
  /** Id of filters.destination (a name), looked up in GET /api/tours/destinations; null when none is chosen. */
  destinationId: string | null;
}

/** Only the filters that are set become parameters, so an empty search is GET /api/tours?page=1&pageSize=9. */
export function tourSearchParams({ filters, region, page, destinationId }: TourSearchRequest): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query.trim().slice(0, MAX_QUERY_LENGTH);
  if (query) params.set("q", query);
  if (destinationId) params.set("destinationId", destinationId);
  const { minDays, maxDays } = durationRange(filters.duration);
  if (minDays !== undefined) params.set("minDays", String(minDays));
  if (maxDays !== undefined) params.set("maxDays", String(maxDays));
  if (filters.date) {
    params.set("dateFrom", filters.date);
    params.set("dateTo", filters.date);
  }
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sort) params.set("sort", SORTS[filters.sort]);
  if (region !== "all") params.set("departureRegion", region);
  params.set("page", String(Math.max(1, page)));
  params.set("pageSize", String(TOUR_PAGE_SIZE));
  return params;
}

export const tourPageCount = (total: number) => Math.max(1, Math.ceil(total / TOUR_PAGE_SIZE));

/** Mirrors TourSearchRules.MaxCalendarMonthsAhead: the date calendar pages no further. */
export const MAX_CALENDAR_MONTHS_AHEAD = 24;

/**
 * GET /api/tours/departure-days for one month: the list's other filters, without the chosen day, the sort or the
 * page, so each day shows how many tours the list would hold once that day is picked.
 */
export function departureDayParams(request: Omit<TourSearchRequest, "page">, month: string): URLSearchParams {
  const params = tourSearchParams({ ...request, filters: { ...request.filters, date: "", sort: "" }, page: 1 });
  params.delete("page");
  params.delete("pageSize");
  params.set("month", month);
  return params;
}

/**
 * The same counts for a list already in the page (a seasonal collection): tours per bookable departure day of
 * the month. `tours` must already be filtered by everything except the day.
 */
export function countByDepartureDay(tours: readonly TourSummary[], month: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tour of tours) {
    for (const date of new Set(tour.upcomingDepartureDates)) {
      if (date.startsWith(month + "-")) counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }
  return counts;
}
