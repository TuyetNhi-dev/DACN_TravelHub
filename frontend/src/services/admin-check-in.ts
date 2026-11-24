import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { decodeDeparture } from "@/lib/admin-decode";
import { bool, invalid, isRecord, itemEnvelope, list, num, optStr, str, type Row } from "@/lib/decode";
import type { CheckInBoard, CheckInBooking } from "@/types/ticket";

const RESOURCE = "check-in";
const base = (departureId: string) => `/api/admin/departures/${encodeURIComponent(departureId)}`;

function decodeBooking(row: Row): CheckInBooking {
  return {
    bookingId: str(row, "bookingId", RESOURCE), code: str(row, "code", RESOURCE),
    contactName: str(row, "contactName", RESOURCE), contactPhone: optStr(row, "contactPhone", RESOURCE),
    passengers: list(row.passengers, p => ({
      id: str(p, "id", RESOURCE), fullName: str(p, "fullName", RESOURCE), type: str(p, "type", RESOURCE),
      checkedInAt: optStr(p, "checkedInAt", RESOURCE), checkedInBy: optStr(p, "checkedInBy", RESOURCE),
    }), RESOURCE),
  };
}

function decodeBoard(row: Row): CheckInBoard {
  return {
    departure: decodeDeparture(isRecord(row.departure) ? row.departure : invalid(RESOURCE)),
    closedReason: optStr(row, "closedReason", RESOURCE), canUndo: bool(row, "canUndo", RESOURCE),
    canScan: bool(row, "canScan", RESOURCE), passengerCount: num(row, "passengerCount", RESOURCE),
    checkedInCount: num(row, "checkedInCount", RESOURCE), bookings: list(row.bookings, decodeBooking, RESOURCE),
  };
}

export async function getCheckInBoard(departureId: string, signal?: AbortSignal): Promise<CheckInBoard> {
  return itemEnvelope(await apiGet(`${base(departureId)}/check-in`, signal), decodeBoard, RESOURCE);
}

/** Verifies the QR text on the server and returns its order; nobody is checked in yet. */
export async function scanTicket(departureId: string, payload: string): Promise<CheckInBooking> {
  return itemEnvelope(await apiPost(`${base(departureId)}/check-in/scan`, { payload }), decodeBooking, RESOURCE);
}

export async function checkInPassengers(departureId: string, passengerIds: string[]): Promise<CheckInBoard> {
  return itemEnvelope(await apiPost(`${base(departureId)}/check-ins`, { passengerIds }), decodeBoard, RESOURCE);
}

export async function undoCheckIn(departureId: string, passengerId: string): Promise<CheckInBoard> {
  const value = await apiDelete(`${base(departureId)}/check-ins/${encodeURIComponent(passengerId)}`);
  return itemEnvelope(value, decodeBoard, RESOURCE);
}
