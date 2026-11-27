/** Mirrors TravelHub.Api.Features.Tickets and Features.Admin.CheckIn DTOs (migration 017). */
import type { AdminDeparture } from "@/types/admin";

export interface TicketPassenger {
  fullName: string;
  type: string;
  checkedIn: boolean;
}

/** GET /api/bookings/{id}/ticket. qrPayload is the only thing inside the QR and holds no personal data. */
export interface TourTicket {
  bookingId: string;
  bookingCode: string;
  itemStatus: string;
  ticketCode: string;
  qrPayload: string;
  tourCode: string;
  tourTitle: string;
  departureFrom: string;
  departureDate: string;
  returnDate: string;
  passengers: TicketPassenger[];
}

export interface CheckInPassenger {
  id: string;
  fullName: string;
  type: string;
  /** UTC instant; null while the passenger has not boarded. */
  checkedInAt: string | null;
  checkedInBy: string | null;
}

/** A paid order of the departure; unpaid holds cannot board and are not listed. */
export interface CheckInBooking {
  bookingId: string;
  code: string;
  contactName: string;
  contactPhone: string | null;
  passengers: CheckInPassenger[];
}

export interface CheckInBoard {
  departure: AdminDeparture;
  /** Null while check-in is open; otherwise why it is closed. */
  closedReason: string | null;
  canUndo: boolean;
  /** False when the server has no signing key: QR scanning is off, manual check-in still works. */
  canScan: boolean;
  passengerCount: number;
  checkedInCount: number;
  bookings: CheckInBooking[];
}
