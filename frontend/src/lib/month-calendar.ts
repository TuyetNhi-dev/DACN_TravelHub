/**
 * Pure logic behind the shared month calendar: grid cells with lunar dates and holidays, keyboard
 * movement and date-range selection. Dates are Vietnamese calendar days "yyyy-mm-dd".
 */
import { addDays, monthGrid, monthOf, shiftMonth, weekdayLabel } from "@/lib/flight-calendar";
import { jdFromDate, solarToLunar, type LunarDate } from "@/lib/lunar-calendar";
import { holidaysBetween, type VnHoliday } from "@/lib/vn-holidays";

/** Column headings, Monday first. */
export const WEEK_HEADINGS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const SUNDAY_COLUMN = 6;
const DAYS_PER_WEEK = 7;

export interface CalendarCell {
  date: string;
  /** Solar day of month. */
  day: number;
  lunar: LunarDate | null;
  /** "15" on most days; "1/2" on mùng 1, "1/6N" on mùng 1 of a leap month. */
  lunarLabel: string;
  holidays: VnHoliday[];
  /** Named holidays only (official/traditional), shown as labels in the cell. */
  labelled: VnHoliday[];
  isToday: boolean;
  isSunday: boolean;
}

/** Lunar label for a calendar cell: the month is written only on mùng 1, with "N" for a leap month. */
export function lunarCellLabel(lunar: LunarDate | null): string {
  if (!lunar) return "";
  return lunar.day === 1 ? `1/${lunar.month}${lunar.leap ? "N" : ""}` : String(lunar.day);
}

function lastDayOf(month: string): string {
  return addDays(`${shiftMonth(month, 1)}-01`, -1);
}

/** Weeks of a month (Monday first) with lunar dates and holidays; null pads days of neighbouring months. */
export function calendarMonth(month: string, today: string): (CalendarCell | null)[][] {
  const byDate = new Map<string, VnHoliday[]>();
  for (const holiday of holidaysBetween(`${month}-01`, lastDayOf(month))) {
    byDate.set(holiday.date, [...(byDate.get(holiday.date) ?? []), holiday]);
  }
  return monthGrid(month).map(week => week.map((date, column) => {
    if (date === null) return null;
    const lunar = solarToLunar(date);
    const holidays = byDate.get(date) ?? [];
    return {
      date,
      day: Number(date.slice(8)),
      lunar,
      lunarLabel: lunarCellLabel(lunar),
      holidays,
      labelled: holidays.filter(holiday => holiday.kind !== "lunar-day"),
      isToday: date === today,
      isSunday: column === SUNDAY_COLUMN,
    };
  }));
}

/** `count` consecutive months starting at `first` ("yyyy-mm"). */
export function visibleMonths(first: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftMonth(first, index));
}

/** The first visible month that keeps `date` on screen when `count` months are shown from `first`. */
export function monthShowing(date: string, first: string, count: number): string {
  const month = monthOf(date);
  if (month < first) return month;
  const last = shiftMonth(first, count - 1);
  return month > last ? shiftMonth(month, -(count - 1)) : first;
}

/** Column of a date, 0 = Monday … 6 = Sunday. */
export function weekdayColumn(date: string): number {
  return WEEK_HEADINGS.indexOf(weekdayLabel(date) as (typeof WEEK_HEADINGS)[number]);
}

function sameDayInMonth(date: string, months: number): string {
  const target = shiftMonth(monthOf(date), months);
  const lastDay = Number(lastDayOf(target).slice(8));
  return `${target}-${String(Math.min(Number(date.slice(8)), lastDay)).padStart(2, "0")}`;
}

/**
 * Date reached from `date` by a grid key (WAI-ARIA date-picker pattern): arrows move a day or a week,
 * Home/End go to the start/end of the week, PageUp/PageDown change month. Null for other keys.
 */
export function moveDate(date: string, key: string): string | null {
  switch (key) {
    case "ArrowLeft": return addDays(date, -1);
    case "ArrowRight": return addDays(date, 1);
    case "ArrowUp": return addDays(date, -DAYS_PER_WEEK);
    case "ArrowDown": return addDays(date, DAYS_PER_WEEK);
    case "Home": return addDays(date, -weekdayColumn(date));
    case "End": return addDays(date, SUNDAY_COLUMN - weekdayColumn(date));
    case "PageUp": return sameDayInMonth(date, -1);
    case "PageDown": return sameDayInMonth(date, 1);
    default: return null;
  }
}

export interface DateRange {
  start: string | null;
  end: string | null;
}

export const EMPTY_RANGE: DateRange = { start: null, end: null };

/** Next range after picking `date`: first pick sets the start, a later day closes the range, otherwise restart. */
export function pickRange(range: DateRange, date: string): DateRange {
  if (range.start && !range.end && date > range.start) return { start: range.start, end: date };
  return { start: date, end: null };
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return jdFromDate(day, month, year);
}

/** Nights between start and end (check-in → check-out); null until both are set. */
export function nightsOf(range: DateRange): number | null {
  return range.start && range.end ? dayNumber(range.end) - dayNumber(range.start) : null;
}

export type RangePosition = "start" | "end" | "middle" | null;

export function rangePosition(date: string, range: DateRange): RangePosition {
  if (date === range.start) return "start";
  if (date === range.end) return "end";
  return range.start && range.end && date > range.start && date < range.end ? "middle" : null;
}
