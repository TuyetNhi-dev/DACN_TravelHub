import { apiGet, apiPost } from "@/lib/api-client";
import { itemEnvelope, listEnvelope } from "@/lib/decode";
import { decodeBookingDetail, decodeBookingSummary } from "@/services/bookings";
import type { BookingDetail, BookingItemStatus, BookingSummary, ServiceType } from "@/types/booking";

const RESOURCE = "đơn đặt chỗ";
const BASE = "/api/admin/bookings";

export interface AdminBookingFilter {
  status: BookingItemStatus | "";
  serviceType: ServiceType | "";
}

export type AdminAction = "confirm" | "reject" | "complete";

/** scope: the top-bar choice ("all", "region:SOUTH", "branch:HCM"); the server checks it against the roles. */
export async function getAdminBookings(filter: AdminBookingFilter, scope: string, signal?: AbortSignal)
  : Promise<BookingSummary[]> {
  const params = new URLSearchParams({ scope });
  if (filter.status) params.set("status", filter.status);
  if (filter.serviceType) params.set("serviceType", filter.serviceType);
  const query = params.size ? "?" + params : "";
  return listEnvelope(await apiGet(BASE + query, signal), decodeBookingSummary, RESOURCE);
}

export async function getAdminBooking(id: string, signal?: AbortSignal): Promise<BookingDetail> {
  return itemEnvelope(await apiGet(`${BASE}/${encodeURIComponent(id)}`, signal), decodeBookingDetail, RESOURCE);
}

export async function runAdminAction(id: string, action: AdminAction, supplierConfirmationCode = "")
  : Promise<BookingDetail> {
  const body = action === "confirm" ? { supplierConfirmationCode: supplierConfirmationCode.trim() || null } : {};
  const value = await apiPost(`${BASE}/${encodeURIComponent(id)}/${action}`, body);
  return itemEnvelope(value, decodeBookingDetail, RESOURCE);
}
