/** Pure helpers of the e-ticket and check-in screens (migration 017). */
import { normalizeSearch } from "@/lib/format";
import type { BookingItemStatus, ServiceType } from "@/types/booking";
import type { CheckInBooking } from "@/types/ticket";

/** Mirrors TicketToken.Prefix: text starting with it is a scanned QR, anything else is a search. */
export const TICKET_PREFIX = "SH1.";
/** Mirrors TicketService.TicketStatuses: a ticket exists for paid tour orders and finished trips. */
const TICKET_STATUSES: readonly BookingItemStatus[] = ["confirmed", "completed"];

const TICKET_STATUS_LABELS: Record<string, string> = {
  confirmed: "Đã thanh toán",
  completed: "Chuyến đi đã hoàn tất",
};

export const ticketStatusLabel = (itemStatus: string) => TICKET_STATUS_LABELS[itemStatus] ?? itemStatus;
/** Name of the saved QR image; the ticket code is random, so it reveals nothing about the traveller. */
export const ticketQrFileName = (ticketCode: string) => `ve-saihanh-${ticketCode}.png`;

export const ticketHref =(bookingId: string) => `/bookings/${encodeURIComponent(bookingId)}/ve`;
export const checkInHref = (departureId: string) => `/admin/departures/${encodeURIComponent(departureId)}/check-in`;

export function hasTicket(booking: { serviceType: ServiceType; itemStatus: BookingItemStatus }): boolean {
  return booking.serviceType === "tour" && TICKET_STATUSES.includes(booking.itemStatus);
}

export function isTicketPayload(text: string): boolean {
  return text.trim().toUpperCase().startsWith(TICKET_PREFIX);
}

/** Orders whose code, contact or a passenger name contains the text (accents and case ignored). */
export function filterCheckInBookings(bookings: readonly CheckInBooking[], text: string): CheckInBooking[] {
  const query = normalizeSearch(text);
  if (!query) return [...bookings];
  return bookings.filter(booking => [booking.code, booking.contactName, ...booking.passengers.map(p => p.fullName)]
    .some(value => normalizeSearch(value).includes(query)));
}

export function waitingPassengerIds(booking: CheckInBooking): string[] {
  return booking.passengers.filter(passenger => passenger.checkedInAt === null).map(passenger => passenger.id);
}

export function bookingProgress(booking: CheckInBooking): { checkedIn: number; total: number } {
  const total = booking.passengers.length;
  return { checkedIn: total - waitingPassengerIds(booking).length, total };
}

export type ProgressFilter = "all" | "waiting" | "done";

export const PROGRESS_FILTERS: readonly { id: ProgressFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "waiting", label: "Còn chờ" },
  { id: "done", label: "Đã đủ" },
];

/** "waiting": someone of the order has not boarded yet; "done": everyone has. */
export function matchesProgress(booking: CheckInBooking, filter: ProgressFilter): boolean {
  if (filter === "all") return true;
  const { checkedIn, total } = bookingProgress(booking);
  return filter === "done" ? checkedIn === total : checkedIn < total;
}

/** Whole-number share of the group already checked in; 0 for an empty board. */
export function boardPercent(board: { passengerCount: number; checkedInCount: number }): number {
  return board.passengerCount === 0 ? 0 : Math.round((board.checkedInCount / board.passengerCount) * 100);
}

/** The board's copy of an order, so a scan result shows the latest check-in state after a write. */
export function findBooking(bookings: readonly CheckInBooking[], bookingId: string | null): CheckInBooking | null {
  return bookingId === null ? null : bookings.find(booking => booking.bookingId === bookingId) ?? null;
}
