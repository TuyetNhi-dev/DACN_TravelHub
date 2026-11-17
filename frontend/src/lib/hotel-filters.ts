import { normalizeSearch } from "@/lib/format";
import type { HotelSummary } from "@/types/hotel";

export type HotelSort = "default" | "low" | "high" | "stars";

export interface HotelFilters {
  query: string;
  maxPrice: string;
  stars: string;
  sort: HotelSort;
}

export const EMPTY_HOTEL_FILTERS: HotelFilters = { query: "", maxPrice: "", stars: "", sort: "default" };

/** Hotels without a current partner price sort last: there is nothing to compare. */
function byPrice(a: HotelSummary, b: HotelSummary, direction: 1 | -1): number {
  if (a.referencePricePerNight === null) return b.referencePricePerNight === null ? 0 : 1;
  if (b.referencePricePerNight === null) return -1;
  return (a.referencePricePerNight - b.referencePricePerNight) * direction;
}

export function filterHotels(hotels: HotelSummary[], filters: HotelFilters): HotelSummary[] {
  const query = normalizeSearch(filters.query);
  const rows = hotels.filter(hotel =>
    normalizeSearch([hotel.name, hotel.city, hotel.address].join(" ")).includes(query)
    && (!filters.maxPrice || (hotel.referencePricePerNight !== null
      && hotel.referencePricePerNight <= Number(filters.maxPrice)))
    && (!filters.stars || hotel.starRating === Number(filters.stars)));
  if (filters.sort === "low") return [...rows].sort((a, b) => byPrice(a, b, 1));
  if (filters.sort === "high") return [...rows].sort((a, b) => byPrice(a, b, -1));
  if (filters.sort === "stars") return [...rows].sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
  return rows;
}

/** Descriptions from the seed read "<note>. Tiện nghi: a, b, c." — expose the amenities as chips. */
export function amenitiesOf(description: string | null): string[] {
  const match = description?.match(/Tiện nghi:\s*([^.]*)/u);
  return match ? match[1].split(",").map(item => item.trim()).filter(Boolean) : [];
}
