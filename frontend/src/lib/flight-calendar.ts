/** Calendar arithmetic on "yyyy-mm-dd" Vietnamese dates. They carry no time zone, so UTC math is exact. */

const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MILLION = 1_000_000;
const THOUSAND = 1_000;
const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
const WEEKDAY_NAMES = [
  "Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy",
] as const;

/** Days shown either side of the selected day in the price strip and the flexible-date table. */
export const FLEXIBLE_DAYS = 3;
/** Matches FlightPriceCalendar.MaxMonthsAhead on the server. */
export const MAX_MONTHS_AHEAD = 11;
/** Mandatory wording: the lowest contract price on file, never "the cheapest on the market". */
export const LOWEST_QUOTE_NOTE = "Giá hợp đồng thấp nhất hiện có, chờ xác nhận chỗ.";

function toUtc(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * DAY_MS);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function shiftMonth(month: string, months: number): string {
  const [year, index] = month.split("-").map(Number);
  return fromUtc(Date.UTC(year, index - 1 + months, 1)).slice(0, 7);
}

/** Months the server accepts: this month up to MAX_MONTHS_AHEAD months ahead. */
export function isBookableMonth(month: string, today: string): boolean {
  const current = monthOf(today);
  return month >= current && month <= shiftMonth(current, MAX_MONTHS_AHEAD);
}

/** The selected day with FLEXIBLE_DAYS either side, shifted forward so no day lies before today. */
export function dayWindow(center: string, today: string): string[] {
  const start = addDays(center, -FLEXIBLE_DAYS) < today ? today : addDays(center, -FLEXIBLE_DAYS);
  return Array.from({ length: FLEXIBLE_DAYS * 2 + 1 }, (_, index) => addDays(start, index));
}

export function monthsCovering(days: readonly string[]): string[] {
  return [...new Set(days.map(monthOf))];
}

/** Weeks of a month, Monday first; null pads the days that belong to the neighbouring months. */
export function monthGrid(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const lead = (new Date(toUtc(first)).getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  const length = (toUtc(`${shiftMonth(month, 1)}-01`) - toUtc(first)) / DAY_MS;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 0; day < length; day += 1) cells.push(addDays(first, day));
  while (cells.length % DAYS_PER_WEEK) cells.push(null);
  return Array.from({ length: cells.length / DAYS_PER_WEEK },
    (_, week) => cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK));
}

export function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[new Date(toUtc(iso)).getUTCDay()];
}

export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[new Date(toUtc(iso)).getUTCDay()];
}

/** "2026-12" → "Tháng 12/2026". */
export function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  return `Tháng ${Number(index)}/${year}`;
}

/** Short price for calendar cells: 1650000 → "1,65tr", 890000 → "890K". */
export function compactPrice(value: number): string {
  if (value >= MILLION) return `${(value / MILLION).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}tr`;
  return `${Math.round(value / THOUSAND)}K`;
}

/** Lowest non-empty price among the given values, or null when none has a quote. */
export function lowestOf(values: readonly (number | null)[]): number | null {
  const prices = values.filter((value): value is number => value !== null);
  return prices.length ? Math.min(...prices) : null;
}
