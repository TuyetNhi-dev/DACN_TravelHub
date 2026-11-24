import { formatCurrency, formatDate, normalizeSearch } from "@/lib/format";
import { holidaysBetween } from "@/lib/vn-holidays";
import type { TourDeparture, TourSummary } from "@/types/tour";

/**
 * Named holidays the trip touches (departure to return day), e.g. "Tết Dương lịch", so a departure row can say
 * which dates are a holiday trip. Mùng 1 and rằm of every lunar month are left out: they are not holidays.
 */
export function tripHolidayNames(departure: Pick<TourDeparture, "departureDate" | "returnDate">): string[] {
  const names = holidaysBetween(departure.departureDate, departure.returnDate)
    .filter(holiday => holiday.kind !== "lunar-day")
    .map(holiday => holiday.name);
  return [...new Set(names)];
}

export const tourHref = (id: string) => "/tours/" + encodeURIComponent(id);

/** Tour page with this departure already picked in the booking panel (read by parseBookingPrefill). */
export const departureHref = (tourId: string, departureId: string) =>
  `${tourHref(tourId)}?departure=${encodeURIComponent(departureId)}`;

/** Up to this many seats left, the count is highlighted; it is the real count either way. */
const FEW_SEATS = 5;
export const isFewSeats = (seats: number) => seats <= FEW_SEATS;

/** The API only returns departures after today, so 1 is the smallest value. */
export function departsInLabel(days: number): string {
  return days <= 1 ? "Khởi hành ngày mai" : `Khởi hành sau ${days} ngày`;
}

export function tourDuration(tour: Pick<TourSummary, "durationDays" | "durationNights">): string {
  return tour.durationNights > 0
    ? `${tour.durationDays} ngày ${tour.durationNights} đêm`
    : `${tour.durationDays} ngày`;
}

export type DurationFilter = "" | "short" | "medium" | "long";
export type PriceSort = "" | "low" | "high";

export interface TourFilters {
  query: string;
  destination: string;
  maxPrice: string;
  duration: DurationFilter;
  date: string;
  sort: PriceSort;
}

export const EMPTY_TOUR_FILTERS: TourFilters = {
  query: "", destination: "", maxPrice: "", duration: "", date: "", sort: "",
};

export const DURATION_OPTIONS: readonly { value: DurationFilter; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "short", label: "Tối đa 3 ngày" },
  { value: "medium", label: "4 – 5 ngày" },
  { value: "long", label: "Trên 5 ngày" },
];

/** One removable chip per active filter, in the order the filter panel shows them. */
export interface ActiveFilter {
  key: Exclude<keyof TourFilters, "sort">;
  label: string;
}

export function activeTourFilters(filters: TourFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  const query = filters.query.trim();
  if (query) chips.push({ key: "query", label: `“${query}”` });
  if (filters.destination) chips.push({ key: "destination", label: filters.destination });
  if (filters.date) chips.push({ key: "date", label: `Khởi hành ${formatDate(filters.date)}` });
  const duration = DURATION_OPTIONS.find(option => option.value && option.value === filters.duration);
  if (duration) chips.push({ key: "duration", label: duration.label });
  if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Đến ${formatCurrency(Number(filters.maxPrice))}` });
  return chips;
}

const SHORT_TRIP_MAX_DAYS = 3;
const MEDIUM_TRIP_MAX_DAYS = 5;

/** Day range of a duration choice; shared by the in-page filter and the minDays/maxDays sent to the API. */
export function durationRange(filter: DurationFilter): { minDays?: number; maxDays?: number } {
  if (filter === "short") return { maxDays: SHORT_TRIP_MAX_DAYS };
  if (filter === "medium") return { minDays: SHORT_TRIP_MAX_DAYS + 1, maxDays: MEDIUM_TRIP_MAX_DAYS };
  if (filter === "long") return { minDays: MEDIUM_TRIP_MAX_DAYS + 1 };
  return {};
}

function matchesDuration(days: number, filter: DurationFilter): boolean {
  const { minDays, maxDays } = durationRange(filter);
  return (minDays === undefined || days >= minDays) && (maxDays === undefined || days <= maxDays);
}

export function filterTours(tours: TourSummary[], filters: TourFilters): TourSummary[] {
  const query = normalizeSearch(filters.query);
  const rows = tours.filter(tour =>
    normalizeSearch([tour.title, tour.destination, tour.departureFrom, tour.code].join(" ")).includes(query)
    && (!filters.destination || tour.destination === filters.destination)
    && (!filters.maxPrice || tour.basePrice <= Number(filters.maxPrice))
    && matchesDuration(tour.durationDays, filters.duration)
    && (!filters.date || tour.upcomingDepartureDates.includes(filters.date)));
  if (!filters.sort) return rows;
  const direction = filters.sort === "low" ? 1 : -1;
  return [...rows].sort((a, b) => (a.basePrice - b.basePrice) * direction);
}

export function destinationsOf(tours: TourSummary[]): string[] {
  return [...new Set(tours.map(tour => tour.destination))].sort((a, b) => a.localeCompare(b, "vi"));
}

export function seatLabel(departure: TourDeparture): string {
  if (departure.status !== "open") return "Ngừng nhận khách";
  if (departure.availableSeats === 0) return "Hết chỗ";
  return `Còn ${departure.availableSeats}/${departure.capacity} chỗ`;
}

/** Display estimate mirroring BookingPricing.ForTour; the server recalculates the real total. */
export function tourEstimate(departure: TourDeparture, adults: number, children: number): number {
  return departure.adultPrice * adults + (departure.childPrice ?? departure.adultPrice) * children;
}

