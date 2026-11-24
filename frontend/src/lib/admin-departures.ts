/** Pure rules of the admin departure screens. Limits mirror DepartureRules; the server checks them again. */
import { toTerms, type TermsForm } from "@/lib/admin-forms";
import { formatDate } from "@/lib/format";
import type {
  AdminDeparture, AdminTourDetail, BulkResult, DepartureStatus, DepartureTerms, Manifest,
} from "@/types/admin";

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

/** Tour orders are paid once confirmed (ManifestExcel uses the same words). */
const PAID_STATUSES = new Set(["confirmed", "completed"]);
const PAYMENT_LABELS: Record<string, string> = {
  pending: "Chưa thanh toán (đang giữ chỗ)", awaiting_supplier: "Chờ đối tác", awaiting_payment: "Chờ thanh toán",
  confirmed: "Đã thanh toán", completed: "Đã thanh toán",
};
export const paymentStatusLabel = (status: string) => PAYMENT_LABELS[status] ?? status;
export const isPaid = (status: string) => PAID_STATUSES.has(status);

export interface ManifestSummary {
  guests: number;
  adults: number;
  children: number;
  bookings: number;
  /** Orders already paid (confirmed or completed) against those still holding seats unpaid. */
  paidBookings: number;
  belowMinimum: boolean;
  /** Seats held without an order on this list (e.g. sold outside the system); shown so the counts add up. */
  heldOutsideList: number;
}

export function manifestSummary(manifest: Manifest): ManifestSummary {
  const { departure, bookings, totalGuests } = manifest;
  return {
    guests: totalGuests,
    adults: bookings.reduce((sum, b) => sum + b.adults, 0),
    children: bookings.reduce((sum, b) => sum + b.children, 0),
    bookings: bookings.length,
    paidBookings: bookings.filter(b => PAID_STATUSES.has(b.status)).length,
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

export interface StatusAction {
  status: DepartureStatus;
  label: string;
  /** Cancelling asks for a reason and shows how many orders it affects. */
  needsReason: boolean;
}

/** DepartureStatus.Next on the server; completed and cancelled are final. */
const NEXT: Record<DepartureStatus, DepartureStatus[]> = {
  open: ["closed", "guaranteed", "cancelled"],
  closed: ["open", "guaranteed", "cancelled"],
  guaranteed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

const ACTION_LABELS: Record<DepartureStatus, string> = {
  open: "Mở bán", closed: "Tạm đóng bán", guaranteed: "Chốt đoàn", in_progress: "Bắt đầu chuyến",
  completed: "Hoàn thành", cancelled: "Hủy chuyến",
};

/** Same checks as DepartureRules.CheckTransition: dates decide whether a sale reopens or a trip starts/ends. */
export function departureActions(departure: AdminDeparture, today: string): StatusAction[] {
  return NEXT[departure.status].filter(next => {
    if (next === "open") return departure.departureDate > today;
    if (next === "in_progress") return departure.departureDate <= today;
    if (next === "completed") return departure.returnDate <= today;
    return true;
  }).map(status => ({ status, label: ACTION_LABELS[status], needsReason: status === "cancelled" }));
}

export type StatusToggle = StatusAction;

export const statusToggleFor = departureActions;

/** Filters of /admin/departures as they appear in the URL. */
export const DEPARTURE_FILTER_DEFAULTS = {
  view: "calendar", month: "", tourId: "", branchId: "", status: "", from: "", to: "", page: 1,
};

/** Default surcharge suggested on public holidays; staff can change or remove it before saving. */
export const HOLIDAY_SURCHARGE_PERCENT = 20;
const PRICE_ROUNDING = 10_000;
const MS_PER_DAY = 86_400_000;

export interface BulkPreviewRow {
  date: string;
  /** Official holidays the trip touches (departure to return day). */
  holidays: string[];
  adultPrice: number;
  childPrice: number | null;
}

/** Adds a percentage and rounds to the nearest 10.000 đ, as prices are shown to customers. */
export function withSurcharge(price: number, percent: number): number {
  return Math.round((price * (100 + percent)) / 100 / PRICE_ROUNDING) * PRICE_ROUNDING;
}

/**
 * The dates a weekly rule will create, each with the price it will get: trips touching an official holiday get
 * the surcharge (when percent > 0), the others keep the base price.
 */
export function bulkPreview(dates: string[], durationDays: number, terms: DepartureTerms, percent: number,
  holidaysOf: (from: string, to: string) => string[]): BulkPreviewRow[] {
  return dates.map(date => {
    const holidays = holidaysOf(date, addDaysIso(date, Math.max(1, durationDays) - 1));
    const surcharged = holidays.length > 0 && percent > 0;
    return {
      date, holidays,
      adultPrice: surcharged ? withSurcharge(terms.adultPrice, percent) : terms.adultPrice,
      childPrice: surcharged && terms.childPrice !== null ? withSurcharge(terms.childPrice, percent) : terms.childPrice,
    };
  });
}

/**
 * Holiday dates are created one by one first, with their surcharged price; the weekly request that follows skips
 * dates that already have a departure (server rule), so it only fills the ordinary dates at the base price.
 */
export function surchargedDates(rows: BulkPreviewRow[], terms: DepartureTerms): BulkPreviewRow[] {
  return rows.filter(row => row.adultPrice !== terms.adultPrice || row.childPrice !== terms.childPrice);
}

function addDaysIso(date: string, days: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + days * MS_PER_DAY).toISOString().slice(0, 10);
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
