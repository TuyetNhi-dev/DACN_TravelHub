import { apiGet } from "@/lib/api-client";
import {
  bool, invalid, isoDate, itemEnvelope, list, listEnvelope, num, optIsoDate, optNum, optStr, str, type Row,
} from "@/lib/decode";
import { CABIN_CLASSES } from "@/lib/flight-search";
import type {
  CabinClass, FlexibleFares, FlightDayPrice, FlightDeal, FlightOffer, FlightPriceCalendar, FlightRoute, FlightSearch,
  RoundTripFare,
} from "@/types/flight";

const RESOURCE = "chuyến bay";

function cabin(row: Row, key = "cabinClass"): CabinClass {
  const value = str(row, key, RESOURCE);
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
    remainingSeats: optNum(row, "remainingSeats", RESOURCE),
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

function decodeDayPrice(row: Row): FlightDayPrice {
  return {
    date: isoDate(row, "date", RESOURCE),
    lowestPrice: optNum(row, "lowestPrice", RESOURCE),
    offerCount: num(row, "offerCount", RESOURCE),
    isCheapest: bool(row, "isCheapest", RESOURCE),
  };
}

export function decodePriceCalendar(row: Row): FlightPriceCalendar {
  return {
    from: str(row, "from", RESOURCE),
    to: str(row, "to", RESOURCE),
    cabin: cabin(row, "cabin"),
    month: str(row, "month", RESOURCE),
    cheapestPrice: optNum(row, "cheapestPrice", RESOURCE),
    days: list(row.days, decodeDayPrice, RESOURCE),
  };
}

/** Lowest reference quote per day of one month ("yyyy-mm") for a route. */
export async function getPriceCalendar(route: FlightRoute, month: string,
  signal?: AbortSignal): Promise<FlightPriceCalendar> {
  const params = new URLSearchParams({ from: route.from, to: route.to, cabin: route.cabin, month });
  return itemEnvelope(await apiGet("/api/flights/price-calendar?" + params, signal), decodePriceCalendar, RESOURCE);
}

function decodeRoundTrip(row: Row): RoundTripFare {
  return {
    departDate: isoDate(row, "departDate", RESOURCE),
    returnDate: isoDate(row, "returnDate", RESOURCE),
    total: optNum(row, "total", RESOURCE),
    isCheapest: bool(row, "isCheapest", RESOURCE),
  };
}

export function decodeFlexibleFares(row: Row): FlexibleFares {
  return {
    date: isoDate(row, "date", RESOURCE),
    returnDate: optIsoDate(row, "returnDate", RESOURCE),
    outboundDays: list(row.outboundDays, decodeDayPrice, RESOURCE),
    returnDays: list(row.returnDays, decodeDayPrice, RESOURCE),
    roundTrips: list(row.roundTrips, decodeRoundTrip, RESOURCE),
    cheapestTotal: optNum(row, "cheapestTotal", RESOURCE),
  };
}

/** Lowest quotes within ±3 days of the dates; with a return date, also every outbound × return total. */
export async function getFlexibleFares(route: FlightRoute, date: string, returnDate: string | undefined,
  signal?: AbortSignal): Promise<FlexibleFares> {
  const params = new URLSearchParams({ from: route.from, to: route.to, cabin: route.cabin, date });
  if (returnDate) params.set("returnDate", returnDate);
  return itemEnvelope(await apiGet("/api/flights/flexible?" + params, signal), decodeFlexibleFares, RESOURCE);
}

export function decodeFlightDeal(row: Row): FlightDeal {
  return {
    offerId: str(row, "offerId", RESOURCE),
    flightId: str(row, "flightId", RESOURCE),
    originCode: str(row, "originCode", RESOURCE),
    originCity: str(row, "originCity", RESOURCE),
    destinationCode: str(row, "destinationCode", RESOURCE),
    destinationCity: str(row, "destinationCity", RESOURCE),
    departAt: str(row, "departAt", RESOURCE),
    airline: str(row, "airline", RESOURCE),
    airlineCode: optStr(row, "airlineCode", RESOURCE),
    flightNumber: str(row, "flightNumber", RESOURCE),
    cabinClass: cabin(row),
    referencePrice: num(row, "referencePrice", RESOURCE),
    isFeatured: bool(row, "isFeatured", RESOURCE),
    quoteUpdatedAt: str(row, "quoteUpdatedAt", RESOURCE),
    remainingSeats: num(row, "remainingSeats", RESOURCE),
  };
}

/** One headline quote per route for the next 30 days; `from` narrows it to one departure airport. */
export async function getFlightDeals(from: string, signal?: AbortSignal): Promise<FlightDeal[]> {
  const query = from ? "?" + new URLSearchParams({ from }) : "";
  return listEnvelope(await apiGet("/api/flights/deals" + query, signal), decodeFlightDeal, RESOURCE);
}
