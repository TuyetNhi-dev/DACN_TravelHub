import { apiGet } from "@/lib/api-client";
import {
  bool, invalid, isoDate, isRecord, itemEnvelope, list, listEnvelope, num, optNum, optStr, pagedListEnvelope, str,
  type Row,
} from "@/lib/decode";
import type {
  ItineraryDay, TourCollection, TourCollectionDetail, TourDeparture, TourDetail, TourImage, TourInclusions,
  TourDayCount, TourDestination, TourSuggestion, TourSuggestions, TourSummary, UpcomingDeparture,
} from "@/types/tour";

const RESOURCE = "tour";
/** Home "Sắp khởi hành": departures within this many days, at most SOON_LIMIT cards. */
export const SOON_DAYS = 14;
const SOON_LIMIT = 8;

export function decodeTour(row: Row): TourSummary {
  const dates = row.upcomingDepartureDates;
  return {
    id: str(row, "id", RESOURCE),
    code: str(row, "code", RESOURCE),
    title: str(row, "title", RESOURCE),
    destination: str(row, "destination", RESOURCE),
    departureFrom: optStr(row, "departureFrom", RESOURCE),
    durationDays: num(row, "durationDays", RESOURCE),
    durationNights: num(row, "durationNights", RESOURCE),
    transport: optStr(row, "transport", RESOURCE),
    basePrice: num(row, "basePrice", RESOURCE),
    description: optStr(row, "description", RESOURCE),
    upcomingDepartureDates: Array.isArray(dates) && dates.every(d => typeof d === "string") ? dates : [],
  };
}

function decodeDeparture(row: Row): TourDeparture {
  return {
    id: str(row, "id", RESOURCE),
    departureFrom: str(row, "departureFrom", RESOURCE),
    departureDate: isoDate(row, "departureDate", RESOURCE),
    returnDate: isoDate(row, "returnDate", RESOURCE),
    capacity: num(row, "capacity", RESOURCE),
    availableSeats: num(row, "availableSeats", RESOURCE),
    adultPrice: num(row, "adultPrice", RESOURCE),
    childPrice: optNum(row, "childPrice", RESOURCE),
    status: str(row, "status", RESOURCE),
    isBookable: bool(row, "isBookable", RESOURCE),
  };
}

function decodeItineraryDay(row: Row): ItineraryDay {
  return {
    dayNumber: num(row, "dayNumber", RESOURCE),
    title: str(row, "title", RESOURCE),
    description: optStr(row, "description", RESOURCE),
  };
}

function decodeImage(row: Row): TourImage {
  return { url: str(row, "url", RESOURCE), alt: optStr(row, "alt", RESOURCE) };
}

function decodeLines(value: unknown): string[] {
  return Array.isArray(value) && value.every(line => typeof line === "string") ? value : invalid(RESOURCE);
}

function decodeInclusions(value: unknown): TourInclusions {
  if (!isRecord(value)) return invalid(RESOURCE);
  return { included: decodeLines(value.included), excluded: decodeLines(value.excluded) };
}

export function decodeTourDetail(row: Row): TourDetail {
  return {
    tour: isRecord(row.tour) ? decodeTour(row.tour) : invalid(RESOURCE),
    itinerary: list(row.itinerary, decodeItineraryDay, RESOURCE),
    departures: list(row.departures, decodeDeparture, RESOURCE),
    images: list(row.images, decodeImage, RESOURCE),
    inclusions: decodeInclusions(row.inclusions),
  };
}

/** One page of GET /api/tours; params come from tourSearchParams (lib/tour-search). */
export async function searchTours(params: URLSearchParams, signal?: AbortSignal):
  Promise<{ items: TourSummary[]; total: number }> {
  return pagedListEnvelope(await apiGet(`/api/tours?${params}`, signal), decodeTour, RESOURCE);
}

function decodeDestination(row: Row): TourDestination {
  return { id: str(row, "id", RESOURCE), name: str(row, "name", RESOURCE), tourCount: num(row, "tourCount", RESOURCE) };
}

function decodeSuggestion(row: Row): TourSuggestion {
  return {
    id: str(row, "id", RESOURCE), code: str(row, "code", RESOURCE), title: str(row, "title", RESOURCE),
    destination: str(row, "destination", RESOURCE), basePrice: num(row, "basePrice", RESOURCE),
  };
}

function decodeSuggestions(row: Row): TourSuggestions {
  return {
    destinations: list(row.destinations, decodeDestination, RESOURCE),
    tours: list(row.tours, decodeSuggestion, RESOURCE),
  };
}

function decodeDayCount(row: Row): TourDayCount {
  return { date: isoDate(row, "date", RESOURCE), tourCount: num(row, "tourCount", RESOURCE) };
}

/** Tours per departure day of one month under the other /tours filters; params from departureDayParams. */
export async function getTourDepartureDays(params: URLSearchParams, signal?: AbortSignal):
  Promise<TourDayCount[]> {
  return listEnvelope(await apiGet(`/api/tours/departure-days?${params}`, signal), decodeDayCount, RESOURCE);
}

/** Search box suggestions while the customer types (ROADMAP 8.2). */
export async function getTourSuggestions(text: string, signal?: AbortSignal): Promise<TourSuggestions> {
  const value = await apiGet(`/api/tours/suggest?${new URLSearchParams({ q: text })}`, signal);
  return itemEnvelope(value, decodeSuggestions, RESOURCE);
}

/** Destinations that have a published tour, by name: the "Điểm đến" filter. */
export async function getTourDestinations(signal?: AbortSignal): Promise<TourDestination[]> {
  return listEnvelope(await apiGet("/api/tours/destinations", signal), decodeDestination, RESOURCE);
}


/** Every published tour, unfiltered: home sections, destination and guide pages pick from it. */
export async function getTours(signal?: AbortSignal): Promise<TourSummary[]> {
  return listEnvelope(await apiGet("/api/tours", signal), decodeTour, RESOURCE);
}

export async function getTour(id: string, signal?: AbortSignal): Promise<TourDetail> {
  const value = await apiGet("/api/tours/" + encodeURIComponent(id), signal);
  return itemEnvelope(value, decodeTourDetail, RESOURCE);
}

export function decodeUpcomingDeparture(row: Row): UpcomingDeparture {
  return {
    departureId: str(row, "departureId", RESOURCE),
    tourId: str(row, "tourId", RESOURCE),
    tourCode: str(row, "tourCode", RESOURCE),
    tourTitle: str(row, "tourTitle", RESOURCE),
    destination: str(row, "destination", RESOURCE),
    departureFrom: str(row, "departureFrom", RESOURCE),
    departureDate: isoDate(row, "departureDate", RESOURCE),
    durationDays: num(row, "durationDays", RESOURCE),
    durationNights: num(row, "durationNights", RESOURCE),
    availableSeats: num(row, "availableSeats", RESOURCE),
    adultPrice: num(row, "adultPrice", RESOURCE),
    daysUntilDeparture: num(row, "daysUntilDeparture", RESOURCE),
  };
}

export async function getUpcomingDepartures(signal?: AbortSignal): Promise<UpcomingDeparture[]> {
  const query = new URLSearchParams({ days: String(SOON_DAYS), limit: String(SOON_LIMIT) });
  return listEnvelope(await apiGet(`/api/tours/departures/upcoming?${query}`, signal), decodeUpcomingDeparture,
    RESOURCE);
}

const COLLECTION_RESOURCE = "bộ sưu tập tour";

function decodeCollection(row: Row): TourCollection {
  return {
    slug: str(row, "slug", COLLECTION_RESOURCE),
    name: str(row, "name", COLLECTION_RESOURCE),
    tagline: optStr(row, "tagline", COLLECTION_RESOURCE),
    seasonLabel: optStr(row, "seasonLabel", COLLECTION_RESOURCE),
    coverPlace: optStr(row, "coverPlace", COLLECTION_RESOURCE),
    tourCount: num(row, "tourCount", COLLECTION_RESOURCE),
  };
}

function decodeCollectionDetail(row: Row): TourCollectionDetail {
  return {
    collection: isRecord(row.collection) ? decodeCollection(row.collection) : invalid(COLLECTION_RESOURCE),
    tours: list(row.tours, decodeTour, COLLECTION_RESOURCE),
  };
}

export async function getTourCollections(signal?: AbortSignal): Promise<TourCollection[]> {
  return listEnvelope(await apiGet("/api/tour-collections", signal), decodeCollection, COLLECTION_RESOURCE);
}

export async function getTourCollection(slug: string, signal?: AbortSignal): Promise<TourCollectionDetail> {
  const value = await apiGet("/api/tour-collections/" + encodeURIComponent(slug), signal);
  return itemEnvelope(value, decodeCollectionDetail, COLLECTION_RESOURCE);
}
