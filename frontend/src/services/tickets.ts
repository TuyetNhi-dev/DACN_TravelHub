import { apiGet } from "@/lib/api-client";
import { bool, isoDate, itemEnvelope, list, str, type Row } from "@/lib/decode";
import type { TourTicket } from "@/types/ticket";

const RESOURCE = "vé điện tử";

function decodeTicket(row: Row): TourTicket {
  return {
    bookingId: str(row, "bookingId", RESOURCE), bookingCode: str(row, "bookingCode", RESOURCE),
    itemStatus: str(row, "itemStatus", RESOURCE), ticketCode: str(row, "ticketCode", RESOURCE),
    qrPayload: str(row, "qrPayload", RESOURCE), tourCode: str(row, "tourCode", RESOURCE),
    tourTitle: str(row, "tourTitle", RESOURCE), departureFrom: str(row, "departureFrom", RESOURCE),
    departureDate: isoDate(row, "departureDate", RESOURCE), returnDate: isoDate(row, "returnDate", RESOURCE),
    passengers: list(row.passengers, p => ({
      fullName: str(p, "fullName", RESOURCE), type: str(p, "type", RESOURCE),
      checkedIn: bool(p, "checkedIn", RESOURCE),
    }), RESOURCE),
  };
}

/** The signed-in customer's own e-ticket for a paid tour order. */
export async function getMyTicket(bookingId: string, signal?: AbortSignal): Promise<TourTicket> {
  const value = await apiGet(`/api/bookings/${encodeURIComponent(bookingId)}/ticket`, signal);
  return itemEnvelope(value, decodeTicket, RESOURCE);
}
