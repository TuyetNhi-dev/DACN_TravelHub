import { normalizeSearch } from "@/lib/format";
import type { TourSummary } from "@/types/tour";

/**
 * Home "tours by need" tabs. The API returns no tour categories, so groups are derived only from
 * fields it does return: duration and transport.
 */
export type TourGroupId = "weekend" | "midweek" | "long" | "flight" | "road";

export const TOUR_GROUPS: { id: TourGroupId; label: string }[] = [
  { id: "weekend", label: "Ngắn ngày (≤ 3 ngày)" },
  { id: "midweek", label: "4 – 5 ngày" },
  { id: "long", label: "Dài ngày (≥ 6 ngày)" },
  { id: "flight", label: "Đi máy bay" },
  { id: "road", label: "Đi đường bộ" },
];

const SHORT_TRIP_MAX_DAYS = 3;
const MEDIUM_TRIP_MAX_DAYS = 5;
const FLIGHT_WORDS = ["may bay"];
const ROAD_WORDS = ["o to", "xe", "tau"];

function transportHas(tour: TourSummary, words: string[]): boolean {
  const transport = normalizeSearch(tour.transport ?? "");
  return words.some(word => transport.includes(word));
}

export function inTourGroup(tour: TourSummary, group: TourGroupId): boolean {
  switch (group) {
    case "weekend": return tour.durationDays <= SHORT_TRIP_MAX_DAYS;
    case "midweek": return tour.durationDays > SHORT_TRIP_MAX_DAYS && tour.durationDays <= MEDIUM_TRIP_MAX_DAYS;
    case "long": return tour.durationDays > MEDIUM_TRIP_MAX_DAYS;
    case "flight": return transportHas(tour, FLIGHT_WORDS);
    case "road": return transportHas(tour, ROAD_WORDS) && !transportHas(tour, FLIGHT_WORDS);
  }
}

/** Tours that can still be booked come first; the API order is kept otherwise. */
export function toursInGroup(tours: TourSummary[], group: TourGroupId, limit: number): TourSummary[] {
  const matches = tours.filter(tour => inTourGroup(tour, group));
  const open = matches.filter(tour => tour.upcomingDepartureDates.length > 0);
  const closed = matches.filter(tour => tour.upcomingDepartureDates.length === 0);
  return [...open, ...closed].slice(0, limit);
}

/** Number of tours per destination, matched without accents so "Ha Long" and "Hạ Long" agree. */
export function countByDestination(tours: TourSummary[], destination: string): number {
  const key = normalizeSearch(destination);
  return tours.filter(tour => normalizeSearch(tour.destination) === key).length;
}
