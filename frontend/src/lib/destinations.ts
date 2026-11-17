import { normalizeSearch } from "@/lib/format";

/** "TP. Hồ Chí Minh" → "tp-ho-chi-minh", "Đà Nẵng" → "da-nang". */
export function destinationSlug(name: string): string {
  return normalizeSearch(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function destinationHref(name: string): string {
  return "/destinations/" + destinationSlug(name);
}

/** Collections are opened as a filtered tour list. */
export function collectionHref(slug: string): string {
  return "/tours?collection=" + encodeURIComponent(slug);
}

/** Same rule as the backend TourCollectionService and the migrations/006 CHECK. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Same place, ignoring accents and the "TP." prefix: "TP. Hồ Chí Minh" matches "Hồ Chí Minh". */
export function sameCity(a: string, b: string): boolean {
  return destinationSlug(withoutCityPrefix(a)) === destinationSlug(withoutCityPrefix(b));
}

function withoutCityPrefix(value: string): string {
  return normalizeSearch(value).replace(/^(tp\.?|thanh pho)\s*/, "");
}

/** The display name for a URL slug, taken from names the API actually returned. */
export function placeName(slug: string, names: string[]): string | null {
  return names.find(name => sameCity(name, slug.replace(/-/g, " "))) ?? null;
}

/** Cheapest offer per origin airport into one city, cheapest routes first. */
export function cheapestFlightsTo<T extends { originCode: string; destinationCity: string; referencePrice: number }>(
  flights: T[], city: string, limit: number,
): T[] {
  const best = new Map<string, T>();
  for (const flight of flights) {
    if (!sameCity(flight.destinationCity, city)) continue;
    const current = best.get(flight.originCode);
    if (!current || flight.referencePrice < current.referencePrice) best.set(flight.originCode, flight);
  }
  return [...best.values()].sort((a, b) => a.referencePrice - b.referencePrice).slice(0, limit);
}
