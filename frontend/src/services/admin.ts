import { apiGet, apiPost } from "@/lib/api-client";
import { itemEnvelope, listEnvelope } from "@/lib/decode";
import { decodeBookingActivity } from "@/lib/admin-ops-decode";
import { query } from "@/services/admin-catalog";
import { decodeBookingDetail, decodeBookingSummary } from "@/services/bookings";
import type { BookingActivity } from "@/types/admin-ops";
import type { BookingDetail, BookingItemStatus, BookingSummary, ServiceType } from "@/types/booking";

const RESOURCE = "đơn đặt chỗ";
const BASE = "/api/admin/bookings";

export interface AdminBookingFilter {
  status: BookingItemStatus | "";
  serviceType: ServiceType | "";
  /** Order dates, "yyyy-mm-dd" in Vietnamese time, both inclusive. */
  from: string;
  to: string;
  branchId: string;
  /** Booking code, or part of the customer's name, phone or email. */
  q: string;
}

export type AdminAction = "confirm" | "reject" | "complete" | "cancel";

/** scope: the top-bar choice ("all", "region:SOUTH", "branch:HCM"); the server checks it against the roles. */
export async function getAdminBookings(filter: AdminBookingFilter, scope: string, signal?: AbortSignal)
  : Promise<BookingSummary[]> {
  const url = BASE + query({ scope, ...filter, q: filter.q.trim() });
  return listEnvelope(await apiGet(url, signal), decodeBookingSummary, RESOURCE);
}

export async function getAdminBooking(id: string, signal?: AbortSignal): Promise<BookingDetail> {
  return itemEnvelope(await apiGet(`${BASE}/${encodeURIComponent(id)}`, signal), decodeBookingDetail, RESOURCE);
}

export async function getBookingActivity(id: string, signal?: AbortSignal): Promise<BookingActivity> {
  return itemEnvelope(await apiGet(`${BASE}/${encodeURIComponent(id)}/activity`, signal), decodeBookingActivity,
    RESOURCE);
}

export async function addBookingNote(id: string, text: string): Promise<BookingActivity> {
  return itemEnvelope(await apiPost(`${BASE}/${encodeURIComponent(id)}/notes`, { text }), decodeBookingActivity,
    RESOURCE);
}

export async function runAdminAction(id: string, action: AdminAction, supplierConfirmationCode = "")
  : Promise<BookingDetail> {
  const body = action === "confirm" ? { supplierConfirmationCode: supplierConfirmationCode.trim() || null } : {};
  const value = await apiPost(`${BASE}/${encodeURIComponent(id)}/${action}`, body);
  return itemEnvelope(value, decodeBookingDetail, RESOURCE);
}
