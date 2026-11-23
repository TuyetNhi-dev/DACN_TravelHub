/**
 * Pure helpers of the itinerary and "giá bao gồm / không bao gồm" editors. Limits mirror AdminTourValidator;
 * the server checks them again and answers field errors keyed "days[i].title" or "items[i].description".
 */
import type { FieldErrors } from "@/lib/api-client";
import type { Inclusion, InclusionType, ItineraryDay } from "@/types/admin";

export const MAX_ITINERARY_DAYS = 60;
export const MAX_INCLUSIONS = 40;
export const MAX_DAY_TEXT = 5000;
export const MAX_INCLUSION_TEXT = 500;

export interface DayRow {
  title: string;
  description: string;
}

export interface InclusionRow {
  serviceType: InclusionType;
  description: string;
}

export const EMPTY_DAY: DayRow = { title: "", description: "" };
export const EMPTY_INCLUSION: InclusionRow = { serviceType: "other", description: "" };

export function dayRowsFrom(days: ItineraryDay[]): DayRow[] {
  return [...days].sort((a, b) => a.dayNumber - b.dayNumber)
    .map(day => ({ title: day.title, description: day.description ?? "" }));
}

/** Day numbers follow the list order; the server numbers them the same way. */
export function toItinerary(rows: DayRow[]): ItineraryDay[] {
  return rows.map((row, index) => ({
    dayNumber: index + 1, title: row.title.trim(), description: row.description.trim() || null,
  }));
}

/** A tour whose itinerary length differs from its duration still saves, but the editor says so. */
export function itineraryWarning(dayCount: number, durationDays: number): string | null {
  if (dayCount === 0 || dayCount === durationDays) return null;
  return `Tour ${durationDays} ngày nhưng lịch trình có ${dayCount} ngày.`;
}

export function splitInclusions(items: Inclusion[]): { included: InclusionRow[]; excluded: InclusionRow[] } {
  const row = (item: Inclusion): InclusionRow => ({ serviceType: item.serviceType, description: item.description });
  return {
    included: items.filter(item => item.isIncluded).map(row),
    excluded: items.filter(item => !item.isIncluded).map(row),
  };
}

/** Saved as one list: "bao gồm" lines first, then "không bao gồm", each in the order shown. */
export function joinInclusions(included: InclusionRow[], excluded: InclusionRow[]): Inclusion[] {
  const item = (isIncluded: boolean) => (row: InclusionRow): Inclusion => ({
    serviceType: row.serviceType, description: row.description.trim(), isIncluded,
  });
  return [...included.map(item(true)), ...excluded.map(item(false))];
}

/** Server message for one field of one row, e.g. rowError(errors, "days", 2, "title"). */
export function rowError(errors: FieldErrors, list: string, index: number, field: string): string | undefined {
  return errors[`${list}[${index}].${field}`]?.[0];
}
