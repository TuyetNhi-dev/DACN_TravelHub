/**
 * Pure helpers of the admin screens: form ⇄ API mapping, reordering, weekly-date preview and chart scaling.
 * The server validates everything again; these only shape input and give instant feedback.
 */
import type { AdminTourDetail, DepartureTerms, RegionRevenue, SaveTourInput, ScopeOption } from "@/types/admin";

export const SCOPE_STORAGE_KEY = "saihanh-admin-scope-v1";
export const ALL_SCOPE = "all";
/** Mirrors DepartureRules.MaxBulkDates on the server. */
export const MAX_BULK_DATES = 100;

export type TourForm = Record<keyof SaveTourInput, string>;

export const EMPTY_TOUR_FORM: TourForm = {
  code: "", title: "", destinationId: "", categoryId: "", operatingBranchId: "", durationDays: "3",
  durationNights: "2", basePrice: "", description: "", cancellationPolicy: "", travelNotes: "",
};

export function tourFormFrom(tour: AdminTourDetail): TourForm {
  return {
    code: tour.code, title: tour.title, destinationId: tour.destinationId, categoryId: tour.categoryId ?? "",
    operatingBranchId: tour.branchId, durationDays: String(tour.durationDays),
    durationNights: String(tour.durationNights), basePrice: String(tour.basePrice),
    description: tour.description ?? "", cancellationPolicy: tour.cancellationPolicy ?? "",
    travelNotes: tour.travelNotes ?? "",
  };
}

/** Blank numbers become NaN-free zeros the server rejects with a field message, never a crash. */
export function toSaveTourInput(form: TourForm): SaveTourInput {
  return {
    code: form.code.trim().toUpperCase(), title: form.title.trim(), destinationId: form.destinationId,
    categoryId: form.categoryId || null, operatingBranchId: form.operatingBranchId,
    durationDays: toNumber(form.durationDays), durationNights: toNumber(form.durationNights),
    basePrice: toNumber(form.basePrice), description: form.description.trim() || null,
    cancellationPolicy: form.cancellationPolicy.trim() || null, travelNotes: form.travelNotes.trim() || null,
  };
}

export type TermsForm = Record<keyof DepartureTerms, string>;

export function toTerms(form: TermsForm): DepartureTerms {
  return {
    departureLocationId: form.departureLocationId, operatingBranchId: form.operatingBranchId,
    capacity: toNumber(form.capacity), minGuests: toNumber(form.minGuests), adultPrice: toNumber(form.adultPrice),
    childPrice: form.childPrice.trim() === "" ? null : toNumber(form.childPrice),
  };
}

export function toNumber(value: string): number {
  const number = Number(value.replace(/[.\s]/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

/** Moves one item (drag and drop or the up/down buttons); out-of-range moves return the list unchanged. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Same rule as DepartureRules.WeeklyDates: every chosen weekday in [from, to], "yyyy-mm-dd" in local dates. */
export function weeklyDates(from: string, to: string, weekdays: number[]): string[] {
  const start = parseDay(from);
  const end = parseDay(to);
  if (!start || !end || end < start || weekdays.length === 0) return [];
  const dates: string[] = [];
  for (let day = start; day <= end && dates.length <= MAX_BULK_DATES; day = addDays(day, 1))
    if (weekdays.includes(day.getUTCDay())) dates.push(day.toISOString().slice(0, 10));
  return dates;
}

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** The saved scope if it is still one of the user's options, otherwise "all". */
export function validScope(saved: string | null, options: ScopeOption[]): string {
  return saved && options.some(option => option.value === saved) ? saved : ALL_SCOPE;
}

/** Bar widths for the revenue chart, as a percentage of the best region (0 when nothing was sold). */
export function revenueBars(rows: RegionRevenue[]): { row: RegionRevenue; percent: number }[] {
  const max = Math.max(0, ...rows.map(row => row.revenue));
  return rows.map(row => ({ row, percent: max > 0 ? Math.round((row.revenue / max) * 100) : 0 }));
}

/** Fill of a departure: seats taken against the minimum the trip needs to run. */
export function seatFill(reserved: number, minGuests: number): { percent: number; short: number } {
  const percent = minGuests > 0 ? Math.min(100, Math.round((reserved / minGuests) * 100)) : 100;
  return { percent, short: Math.max(0, minGuests - reserved) };
}
