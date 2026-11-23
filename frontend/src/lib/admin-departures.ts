/** Pure rules of the admin departure screens. Limits mirror DepartureRules; the server checks them again. */
import { toTerms, type TermsForm } from "@/lib/admin-forms";
import { formatDate } from "@/lib/format";
import type { AdminDeparture, AdminTourDetail, BulkResult, DepartureTerms, Manifest } from "@/types/admin";

/** Mirrors AdminDepartureService.DefaultPageSize. */
export const DEPARTURE_PAGE_SIZE = 30;
export const MAX_CAPACITY = 500;
const DEFAULT_CAPACITY = "30";
const DEFAULT_MIN_GUESTS = "10";

export const DEPARTURES_HREF = "/admin/departures";
export const departuresOfTourHref = (tourId: string) => `${DEPARTURES_HREF}?tourId=${encodeURIComponent(tourId)}`;

export const departurePageCount = (total: number) => Math.max(1, Math.ceil(total / DEPARTURE_PAGE_SIZE));

export const manifestHref = (departureId: string) =>
  `${DEPARTURES_HREF}/${encodeURIComponent(departureId)}/manifest`;

/** booking_passengers.passenger_type; "infant" exists in the schema even though booking forms do not offer it yet. */
const PASSENGER_TYPES: Record<string, string> = { adult: "Người lớn", child: "Trẻ em", infant: "Em bé" };
export const passengerTypeLabel = (type: string) => PASSENGER_TYPES[type] ?? type;

export interface ManifestSummary {
  guests: number;
  bookings: number;
  belowMinimum: boolean;
  /** Seats held without an order on this list (e.g. sold outside the system); shown so the counts add up. */
  heldOutsideList: number;
}

export function manifestSummary(manifest: Manifest): ManifestSummary {
  const { departure, bookings, totalGuests } = manifest;
  return {
    guests: totalGuests,
    bookings: bookings.length,
    belowMinimum: departure.reservedSeats < departure.minGuests,
    heldOutsideList: Math.max(0, departure.reservedSeats - totalGuests),
  };
}

/** A new departure starts from the tour's branch and "giá từ"; staff adjust before saving. */
export function newTermsForm(tour: AdminTourDetail): TermsForm {
  return {
    departureLocationId: "", operatingBranchId: tour.branchId, capacity: DEFAULT_CAPACITY,
    minGuests: DEFAULT_MIN_GUESTS, adultPrice: String(tour.basePrice), childPrice: "",
  };
}

export function termsFormFrom(departure: AdminDeparture): TermsForm {
  return {
    departureLocationId: departure.departureLocationId, operatingBranchId: departure.branchId,
    capacity: String(departure.capacity), minGuests: String(departure.minGuests),
    adultPrice: String(departure.adultPrice),
    childPrice: departure.childPrice === null ? "" : String(departure.childPrice),
  };
}

/** PUT /departures/{id} cannot move the departure point, so it is left out. */
export function toUpdateTerms(form: TermsForm): Omit<DepartureTerms, "departureLocationId"> {
  const terms = toTerms(form);
  return {
    operatingBranchId: terms.operatingBranchId, capacity: terms.capacity, minGuests: terms.minGuests,
    adultPrice: terms.adultPrice, childPrice: terms.childPrice,
  };
}

export interface StatusToggle {
  status: "open" | "closed";
  label: string;
}

/** Same rules as AdminDepartureService.SetStatusAsync: cancelled never reopens, a past departure never reopens. */
export function statusToggleFor(departure: AdminDeparture, today: string): StatusToggle | null {
  if (departure.status === "open") return { status: "closed", label: "Đóng bán" };
  if (departure.status === "closed" && departure.departureDate > today) return { status: "open", label: "Mở bán" };
  return null;
}

/** "Còn 5 / 30 chỗ" style line, flagged when the group is still below its minimum size. */
export function seatSummary(departure: AdminDeparture): { text: string; belowMinimum: boolean } {
  return {
    text: `${departure.reservedSeats} / ${departure.capacity} chỗ đã đặt`,
    belowMinimum: departure.reservedSeats < departure.minGuests,
  };
}

export function bulkResultMessage(result: BulkResult): string {
  const created = `Đã tạo ${result.created} lịch khởi hành.`;
  if (result.skippedDates.length === 0) return created;
  return `${created} Bỏ qua ${result.skippedDates.length} ngày đã có lịch: `
    + result.skippedDates.map(formatDate).join(", ") + ".";
}
