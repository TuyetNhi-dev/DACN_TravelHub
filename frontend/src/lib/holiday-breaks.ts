/**
 * "Kỳ nghỉ thông minh": stretches of days off built from the statutory holidays of vn-holidays plus the
 * Saturday and Sunday next to them, and the tours whose whole trip fits inside one.
 *
 * Only the days fixed by law are counted. Compensatory days, swapped working days and the extra Tết or
 * Quốc khánh days are announced every year, so a break is never presented as the official schedule.
 */
import { addDays, shiftMonth, weekdayLabel, weekdayName } from "@/lib/flight-calendar";
import { hasYearlySchedule, holidaysBetween, isTetHoliday, TET_NEW_YEAR, type VnHoliday } from "@/lib/vn-holidays";
import type { TourSummary } from "@/types/tour";

/** How far ahead breaks are listed. */
export const BREAK_HORIZON_MONTHS = 12;
const DAY_MS = 86_400_000;
// A break still running today may have started this many days earlier (Tết plus a weekend is the longest).
const LOOKBACK_DAYS = 10;
const SATURDAY = 6;
const SUNDAY = 0;

/** One working day that, taken as leave, joins the break to the weekend next to it. */
export interface BridgeDay {
  leaveDate: string;
  start: string;
  end: string;
  days: number;
}

export interface HolidayBreak {
  /** The first day off; unique per break, usable as a page anchor. */
  id: string;
  start: string;
  end: string;
  days: number;
  holidayNames: string[];
  /** Statutory days off inside the break; every other day of it is a Saturday or Sunday. */
  holidayDates: string[];
  /** Set when the government announces the actual days off of this holiday each year. */
  scheduleNote: string | null;
  bridge: BridgeDay | null;
}

export interface BreakTourMatch {
  tour: TourSummary;
  departureDate: string;
  returnDate: string;
  /** The trip only fits when the customer also takes the bridge day off. */
  needsBridge: boolean;
}

// Dates carry no time zone, so UTC midnight arithmetic is exact (as in flight-calendar).
const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();
const isWeekend = (iso: string) => [SATURDAY, SUNDAY].includes(weekday(iso));
const daysInclusive = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;

/** Last day listed: the day before the same date BREAK_HORIZON_MONTHS later (from 29/2, the 28/2 after it). */
export function horizonEnd(today: string): string {
  const firstOfMonth = `${shiftMonth(today.slice(0, 7), BREAK_HORIZON_MONTHS)}-01`;
  return addDays(firstOfMonth, Number(today.slice(8)) - 2);
}

/** Last date of the run of days off that contains `from`, walking in `step` (+1 forward, -1 back). */
function edgeOfRun(from: string, step: 1 | -1, isOff: (iso: string) => boolean): string {
  let edge = from;
  while (isOff(addDays(edge, step))) edge = addDays(edge, step);
  return edge;
}

/** A single working day between the break and the next run of days off on that side, if there is one. */
function bridgeOnSide(start: string, end: string, step: 1 | -1, isOff: (iso: string) => boolean): BridgeDay | null {
  const leaveDate = addDays(step === 1 ? end : start, step);
  const beyond = addDays(leaveDate, step);
  if (!isOff(beyond)) return null;
  const far = edgeOfRun(beyond, step, isOff);
  const [from, to] = step === 1 ? [start, far] : [far, end];
  return { leaveDate, start: from, end: to, days: daysInclusive(from, to) };
}

function bestBridge(start: string, end: string, today: string, isOff: (iso: string) => boolean): BridgeDay | null {
  const options = [bridgeOnSide(start, end, -1, isOff), bridgeOnSide(start, end, 1, isOff)]
    .filter((option): option is BridgeDay => option !== null && option.leaveDate >= today);
  return options.sort((a, b) => b.days - a.days)[0] ?? null;
}

/** Tết days collapse into one name; others keep their own, in date order. */
function namesOf(holidays: VnHoliday[]): string[] {
  return [...new Set(holidays.map(h => (isTetHoliday(h) ? TET_NEW_YEAR : h.name)))];
}

function buildBreak(start: string, end: string, official: VnHoliday[], today: string,
  isOff: (iso: string) => boolean): HolidayBreak {
  const inside = official.filter(h => h.date >= start && h.date <= end);
  return {
    id: start, start, end, days: daysInclusive(start, end),
    holidayNames: namesOf(inside),
    holidayDates: [...new Set(inside.map(h => h.date))],
    scheduleNote: inside.find(hasYearlySchedule)?.note ?? null,
    bridge: bestBridge(start, end, today, isOff),
  };
}

/** Breaks that end on or after `today` and start within BREAK_HORIZON_MONTHS, in date order. */
export function holidayBreaks(today: string): HolidayBreak[] {
  const last = horizonEnd(today);
  const official = holidaysBetween(addDays(today, -LOOKBACK_DAYS), last).filter(h => h.kind === "official");
  const offDates = new Set(official.map(h => h.date));
  const isOff = (iso: string) => offDates.has(iso) || isWeekend(iso);
  const breaks: HolidayBreak[] = [];
  for (const holiday of official) {
    if (breaks.length > 0 && holiday.date <= breaks[breaks.length - 1].end) continue;
    const start = edgeOfRun(holiday.date, -1, isOff);
    breaks.push(buildBreak(start, edgeOfRun(holiday.date, 1, isOff), official, today, isOff));
  }
  return breaks.filter(item => item.end >= today && item.start <= last);
}

const dayMonth = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

/** "Thứ Hai 23/11". */
export const dayLabel = (iso: string) => `${weekdayName(iso)} ${dayMonth(iso)}`;

/** "Thứ Bảy 21/11 – Thứ Ba 24/11/2026", or one day when start and end are the same. */
export function rangeLabel(start: string, end: string): string {
  const year = `/${end.slice(0, 4)}`;
  return start === end ? dayLabel(start) + year : `${dayLabel(start)} – ${dayLabel(end)}${year}`;
}

export type StripDayKind = "holiday" | "weekend" | "leave";

/** One day of the strip drawn on a break card. */
export interface StripDay {
  date: string;
  /** "T7", "CN"… */
  weekday: string;
  day: number;
  kind: StripDayKind;
  /** False for the bridge day and the weekend it reaches: they need a day of leave. */
  inBreak: boolean;
}

/** Every day of the break, plus the bridge day and the weekend behind it when there is one. */
export function breakStrip(item: HolidayBreak): StripDay[] {
  const first = item.bridge?.start ?? item.start;
  const last = item.bridge?.end ?? item.end;
  const holidays = new Set(item.holidayDates);
  const days: StripDay[] = [];
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const kind: StripDayKind = holidays.has(date) ? "holiday" : date === item.bridge?.leaveDate ? "leave" : "weekend";
    days.push({ date, weekday: weekdayLabel(date), day: Number(date.slice(8)), kind,
      inBreak: date >= item.start && date <= item.end });
  }
  return days;
}

/** "Đang diễn ra", "Bắt đầu ngày mai" or "Còn 12 ngày", counted from today in Vietnam. */
export function startsInLabel(today: string, item: Pick<HolidayBreak, "start">): string {
  const days = daysInclusive(today, item.start) - 1;
  if (days <= 0) return "Đang diễn ra";
  return days === 1 ? "Bắt đầu ngày mai" : `Còn ${days} ngày`;
}

export interface BreaksSummary {
  next: HolidayBreak;
  longest: HolidayBreak;
  /** Most days in a row reachable with one day of leave, when that beats the longest plain break. */
  longestWithLeave: { item: HolidayBreak; days: number } | null;
}

/** Headline facts of the list; null when there is no break. Ties keep the earlier break. */
export function summarizeBreaks(breaks: readonly HolidayBreak[]): BreaksSummary | null {
  if (breaks.length === 0) return null;
  const longest = breaks.reduce((best, item) => (item.days > best.days ? item : best));
  const bridged = breaks.filter(item => item.bridge !== null)
    .reduce<HolidayBreak | null>((best, item) => (best && best.bridge!.days >= item.bridge!.days ? best : item), null);
  const longestWithLeave = bridged && bridged.bridge!.days > longest.days
    ? { item: bridged, days: bridged.bridge!.days }
    : null;
  return { next: breaks[0], longest, longestWithLeave };
}

/** Page anchor of a break on /ky-nghi, linked from the home section. */
export const breakAnchor = (item: Pick<HolidayBreak, "id">) => `ky-nghi-${item.id}`;

/** Departure date of the tour that fits inside [start, end], counting the departure day as day 1. */
function fittingDeparture(tour: TourSummary, start: string, end: string): string | null {
  return tour.upcomingDepartureDates
    .find(date => date >= start && addDays(date, tour.durationDays - 1) <= end) ?? null;
}

function matchTour(tour: TourSummary, item: HolidayBreak): BreakTourMatch | null {
  const plain = fittingDeparture(tour, item.start, item.end);
  const bridged = plain ?? (item.bridge ? fittingDeparture(tour, item.bridge.start, item.bridge.end) : null);
  if (bridged === null) return null;
  return {
    tour, departureDate: bridged, returnDate: addDays(bridged, tour.durationDays - 1), needsBridge: plain === null,
  };
}

/**
 * Tours with an open departure whose whole trip lies inside the break (or the break plus its bridge day).
 * Trips that need no leave come first, then by departure date and price.
 */
export function toursForBreak(tours: readonly TourSummary[], item: HolidayBreak): BreakTourMatch[] {
  return tours
    .map(tour => matchTour(tour, item))
    .filter((match): match is BreakTourMatch => match !== null)
    .sort((a, b) => Number(a.needsBridge) - Number(b.needsBridge)
      || a.departureDate.localeCompare(b.departureDate)
      || a.tour.basePrice - b.tour.basePrice);
}
