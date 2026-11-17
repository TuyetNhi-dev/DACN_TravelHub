import { apiGet, apiPost } from "@/lib/api-client";
import {
  bool, invalid, isRecord, itemEnvelope, list, listEnvelope, num, optIsoDate, optStr, str, type Row,
} from "@/lib/decode";
import type {
  BookingCustomer, BookingDetail, BookingItemStatus, BookingStatus, BookingSummary, FlightBookingRequest,
  HotelBookingRequest, PassengerInput, PassengerType, PriceLine, ServiceType, TourBookingRequest,
} from "@/types/booking";

const RESOURCE = "đơn đặt chỗ";
const SERVICE_TYPES: ServiceType[] = ["tour", "hotel", "flight"];
const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed"];
const ITEM_STATUSES: BookingItemStatus[] =
  ["pending", "awaiting_supplier", "confirmed", "cancelled", "completed", "failed"];
const PASSENGER_TYPES: PassengerType[] = ["adult", "child"];

function oneOf<T extends string>(row: Row, key: string, allowed: readonly T[]): T {
  const value = str(row, key, RESOURCE);
  return (allowed as readonly string[]).includes(value) ? (value as T) : invalid(RESOURCE);
}

function decodeCustomer(value: unknown): BookingCustomer | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return invalid(RESOURCE);
  return {
    id: str(value, "id", RESOURCE), fullName: str(value, "fullName", RESOURCE),
    email: str(value, "email", RESOURCE), phone: optStr(value, "phone", RESOURCE),
  };
}

export function decodeBookingSummary(row: Row): BookingSummary {
  return {
    id: str(row, "id", RESOURCE),
    code: str(row, "code", RESOURCE),
    serviceType: oneOf(row, "serviceType", SERVICE_TYPES),
    status: oneOf(row, "status", BOOKING_STATUSES),
    itemStatus: oneOf(row, "itemStatus", ITEM_STATUSES),
    title: str(row, "title", RESOURCE),
    subtitle: optStr(row, "subtitle", RESOURCE),
    startDate: optIsoDate(row, "startDate", RESOURCE),
    total: num(row, "total", RESOURCE),
    createdAt: str(row, "createdAt", RESOURCE),
    customer: decodeCustomer(row.customer),
  };
}

function decodePriceLine(row: Row): PriceLine {
  return {
    label: str(row, "label", RESOURCE), quantity: num(row, "quantity", RESOURCE),
    unitPrice: num(row, "unitPrice", RESOURCE), amount: num(row, "amount", RESOURCE),
  };
}

function decodePassenger(row: Row): PassengerInput {
  return {
    fullName: str(row, "fullName", RESOURCE),
    passengerType: oneOf(row, "passengerType", PASSENGER_TYPES),
    birthDate: optIsoDate(row, "birthDate", RESOURCE),
  };
}

export function decodeBookingDetail(row: Row): BookingDetail {
  return {
    ...decodeBookingSummary(row),
    endDate: optIsoDate(row, "endDate", RESOURCE),
    subtotal: num(row, "subtotal", RESOURCE),
    discountTotal: num(row, "discountTotal", RESOURCE),
    supplierConfirmationCode: optStr(row, "supplierConfirmationCode", RESOURCE),
    terms: optStr(row, "terms", RESOURCE),
    priceLines: list(row.priceLines, decodePriceLine, RESOURCE),
    passengers: list(row.passengers, decodePassenger, RESOURCE),
    canCancel: bool(row, "canCancel", RESOURCE),
  };
}

const detail = (value: unknown) => itemEnvelope(value, decodeBookingDetail, RESOURCE);

export async function createTourBooking(request: TourBookingRequest): Promise<BookingDetail> {
  return detail(await apiPost("/api/bookings/tours", request));
}

export async function createHotelBooking(request: HotelBookingRequest): Promise<BookingDetail> {
  return detail(await apiPost("/api/bookings/hotels", request));
}

export async function createFlightBooking(request: FlightBookingRequest): Promise<BookingDetail> {
  return detail(await apiPost("/api/bookings/flights", request));
}

export async function getMyBookings(signal?: AbortSignal): Promise<BookingSummary[]> {
  return listEnvelope(await apiGet("/api/bookings/me", signal), decodeBookingSummary, RESOURCE);
}

export async function getMyBooking(id: string, signal?: AbortSignal): Promise<BookingDetail> {
  return detail(await apiGet("/api/bookings/" + encodeURIComponent(id), signal));
}

export async function cancelMyBooking(id: string): Promise<BookingDetail> {
  return detail(await apiPost(`/api/bookings/${encodeURIComponent(id)}/cancel`));
}
