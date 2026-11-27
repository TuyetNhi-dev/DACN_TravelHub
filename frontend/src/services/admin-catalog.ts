import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { itemEnvelope, pagedListEnvelope } from "@/lib/decode";
import {
  decodeContext, decodeDashboard, decodeDeparture, decodeLookups, decodeManifest, decodeTourDetail,
  decodeTourSummary,
} from "@/lib/admin-decode";
import type {
  AdminContext, AdminDeparture, AdminLookups, AdminTourDetail, AdminTourSummary, BulkResult, Dashboard,
  DepartureStatus, DepartureTerms, Inclusion, ItineraryDay, Manifest, Paged, SaveTourInput, TourImageInput, TourStatus,
} from "@/types/admin";

const R = "quản trị";
const BASE = "/api/admin";
const id = (value: string) => encodeURIComponent(value);

/** Drops empty filters so the URL only carries what the user chose. */
export function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  return search.size ? "?" + search : "";
}

export async function getAdminContext(signal?: AbortSignal): Promise<AdminContext> {
  return itemEnvelope(await apiGet(`${BASE}/context`, signal), decodeContext, R);
}

export async function getAdminLookups(signal?: AbortSignal): Promise<AdminLookups> {
  return itemEnvelope(await apiGet(`${BASE}/lookups`, signal), decodeLookups, R);
}

export async function getDashboard(scope: string, signal?: AbortSignal): Promise<Dashboard> {
  return itemEnvelope(await apiGet(`${BASE}/dashboard${query({ scope })}`, signal), decodeDashboard, R);
}

export interface TourFilter {
  status: TourStatus | "";
  query: string;
  page: number;
  regionId: string;
  branchId: string;
  categoryId: string;
  /** One of TOUR_SORTS (lib/admin-tours.ts); the server accepts only those keys. */
  sort: string;
}

export async function getAdminTours(filter: TourFilter, scope: string, signal?: AbortSignal)
  : Promise<Paged<AdminTourSummary>> {
  const url = `${BASE}/tours${query({ scope, ...filter, query: filter.query.trim() })}`;
  return pagedListEnvelope(await apiGet(url, signal), decodeTourSummary, R);
}

export async function getAdminTour(tourId: string, signal?: AbortSignal): Promise<AdminTourDetail> {
  return itemEnvelope(await apiGet(`${BASE}/tours/${id(tourId)}`, signal), decodeTourDetail, R);
}

const tourItem = (value: unknown) => itemEnvelope(value, decodeTourDetail, R);

export async function createTour(input: SaveTourInput): Promise<AdminTourDetail> {
  return tourItem(await apiPost(`${BASE}/tours`, input));
}

export async function updateTour(tourId: string, input: SaveTourInput): Promise<AdminTourDetail> {
  return tourItem(await apiPut(`${BASE}/tours/${id(tourId)}`, input));
}

export async function setTourStatus(tourId: string, status: TourStatus): Promise<AdminTourDetail> {
  return tourItem(await apiPost(`${BASE}/tours/${id(tourId)}/status`, { status }));
}

export async function cloneTour(tourId: string): Promise<AdminTourDetail> {
  return tourItem(await apiPost(`${BASE}/tours/${id(tourId)}/clone`));
}

export async function saveTourImages(tourId: string, images: TourImageInput[]): Promise<AdminTourDetail> {
  return tourItem(await apiPut(`${BASE}/tours/${id(tourId)}/images`, { images }));
}

export async function saveItinerary(tourId: string, days: ItineraryDay[]): Promise<AdminTourDetail> {
  const body = { days: days.map(day => ({ title: day.title, description: day.description })) };
  return tourItem(await apiPut(`${BASE}/tours/${id(tourId)}/itinerary`, body));
}

export async function saveInclusions(tourId: string, items: Inclusion[]): Promise<AdminTourDetail> {
  return tourItem(await apiPut(`${BASE}/tours/${id(tourId)}/inclusions`, { items }));
}

export interface DepartureFilter {
  tourId: string;
  from: string;
  to: string;
  status: string;
  page: number;
  branchId: string;
  /** Rows per page; the calendar view asks for a whole month at once. */
  pageSize?: number;
}

export async function getAdminDepartures(filter: DepartureFilter, scope: string, signal?: AbortSignal)
  : Promise<Paged<AdminDeparture>> {
  const url = `${BASE}/departures${query({ scope, ...filter })}`;
  return pagedListEnvelope(await apiGet(url, signal), decodeDeparture, R);
}

export async function createDeparture(tourId: string, departureDate: string, terms: DepartureTerms)
  : Promise<AdminDeparture> {
  const value = await apiPost(`${BASE}/tours/${id(tourId)}/departures`, { departureDate, ...terms });
  return itemEnvelope(value, decodeDeparture, R);
}

export interface WeeklyInput {
  fromDate: string;
  toDate: string;
  weekdays: number[];
}

export async function createWeeklyDepartures(tourId: string, weekly: WeeklyInput, terms: DepartureTerms)
  : Promise<BulkResult> {
  const value = await apiPost(`${BASE}/tours/${id(tourId)}/departures/bulk`, { ...weekly, ...terms });
  return itemEnvelope(value, r => ({
    created: typeof r.created === "number" ? r.created : 0,
    skippedDates: Array.isArray(r.skippedDates) ? r.skippedDates.filter(d => typeof d === "string") : [],
  }), R);
}

export async function updateDeparture(departureId: string, terms: Omit<DepartureTerms, "departureLocationId">)
  : Promise<AdminDeparture> {
  return itemEnvelope(await apiPut(`${BASE}/departures/${id(departureId)}`, terms), decodeDeparture, R);
}

/** reason is required by the server when cancelling, and ignored otherwise. */
export async function setDepartureStatus(departureId: string, status: DepartureStatus, reason: string | null = null)
  : Promise<AdminDeparture> {
  const value = await apiPost(`${BASE}/departures/${id(departureId)}/status`, { status, reason });
  return itemEnvelope(value, decodeDeparture, R);
}

export async function getManifest(departureId: string, signal?: AbortSignal): Promise<Manifest> {
  return itemEnvelope(await apiGet(`${BASE}/departures/${id(departureId)}/manifest`, signal), decodeManifest, R);
}

/** A plain link: the browser downloads the file with the session cookie, no script involved. */
export function manifestExcelHref(departureId: string): string {
  return `${BASE}/departures/${id(departureId)}/manifest.xlsx`;
}
