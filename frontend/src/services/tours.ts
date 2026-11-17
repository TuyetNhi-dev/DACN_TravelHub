import { apiGet } from "@/lib/api-client";
import {
  bool, invalid, isoDate, isRecord, itemEnvelope, list, listEnvelope, num, optNum, optStr, str, type Row,
} from "@/lib/decode";
import type {
  ItineraryDay, TourCollection, TourCollectionDetail, TourDeparture, TourDetail, TourSummary,
} from "@/types/tour";

const RESOURCE = "tour";

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

export function decodeTourDetail(row: Row): TourDetail {
  return {
    tour: isRecord(row.tour) ? decodeTour(row.tour) : invalid(RESOURCE),
    itinerary: list(row.itinerary, decodeItineraryDay, RESOURCE),
    departures: list(row.departures, decodeDeparture, RESOURCE),
  };
}

export async function getTours(signal?: AbortSignal): Promise<TourSummary[]> {
  return listEnvelope(await apiGet("/api/tours", signal), decodeTour, RESOURCE);
}

export async function getTour(id: string, signal?: AbortSignal): Promise<TourDetail> {
  const value = await apiGet("/api/tours/" + encodeURIComponent(id), signal);
  return itemEnvelope(value, decodeTourDetail, RESOURCE);
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
