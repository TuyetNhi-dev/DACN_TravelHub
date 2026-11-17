import { apiGet } from "@/lib/api-client";
import { invalid, listEnvelope, num, optStr, str, type Row } from "@/lib/decode";
import { CABIN_CLASSES } from "@/lib/flight-search";
import type { CabinClass, FlightOffer, FlightSearch } from "@/types/flight";

const RESOURCE = "chuyến bay";

function cabin(row: Row): CabinClass {
  const value = str(row, "cabinClass", RESOURCE);
  return CABIN_CLASSES.some(item => item.value === value) ? (value as CabinClass) : invalid(RESOURCE);
}

export function decodeFlightOffer(row: Row): FlightOffer {
  return {
    flightId: str(row, "flightId", RESOURCE),
    offerId: str(row, "offerId", RESOURCE),
    flightNumber: str(row, "flightNumber", RESOURCE),
    airline: str(row, "airline", RESOURCE),
    airlineCode: optStr(row, "airlineCode", RESOURCE),
    originCode: str(row, "originCode", RESOURCE),
    originCity: str(row, "originCity", RESOURCE),
    destinationCode: str(row, "destinationCode", RESOURCE),
    destinationCity: str(row, "destinationCity", RESOURCE),
    departAt: str(row, "departAt", RESOURCE),
    arriveAt: str(row, "arriveAt", RESOURCE),
    durationMinutes: num(row, "durationMinutes", RESOURCE),
    cabinClass: cabin(row),
    referencePrice: num(row, "referencePrice", RESOURCE),
    baggageTerms: optStr(row, "baggageTerms", RESOURCE),
    changeCancelTerms: optStr(row, "changeCancelTerms", RESOURCE),
    quoteExpiresAt: optStr(row, "quoteExpiresAt", RESOURCE),
  };
}

/** Route/date filtering happens on the server; the client only refines the returned page. */
export async function searchFlights(search: Pick<FlightSearch, "from" | "to" | "date" | "cabin">,
  signal?: AbortSignal): Promise<FlightOffer[]> {
  const params = new URLSearchParams({ from: search.from, to: search.to, cabin: search.cabin });
  if (search.date) params.set("date", search.date);
  return listEnvelope(await apiGet("/api/flights?" + params, signal), decodeFlightOffer, RESOURCE);
}

export async function getUpcomingFlights(signal?: AbortSignal): Promise<FlightOffer[]> {
  return listEnvelope(await apiGet("/api/flights", signal), decodeFlightOffer, RESOURCE);
}
