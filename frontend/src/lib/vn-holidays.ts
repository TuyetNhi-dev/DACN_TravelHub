/**
 * Vietnamese holidays for calendar display.
 *
 * - `official`: public holidays with pay under Bộ luật Lao động 2019, Điều 112 (1/1, Tết Âm lịch,
 *   Giỗ Tổ 10/3 âm, 30/4, 1/5, Quốc khánh 2/9), plus Ngày Văn hóa Việt Nam 24/11 from 2026
 *   (Nghị quyết 28/2026/QH16). Only days fixed by the law itself are computed.
 *   The Tết schedule (5 days) and the day next to 2/9 (1/9 or 3/9) are announced by the Prime Minister
 *   each year, so the exact extra days, compensatory days off and day swaps are NOT inferred here —
 *   see `note` on those entries.
 * - `traditional`: customary lunar festivals that are not days off (rằm tháng Giêng, Vu Lan, Trung thu,
 *   ông Công ông Táo).
 * - `lunar-day`: mùng 1 and rằm (15) of every lunar month, leap months included, unless a named holiday
 *   already falls on that day.
 */
import { jdFromDate, lunarMonthLength, lunarToSolar, solarToLunar, type LunarDate } from '@/lib/lunar-calendar';

export type HolidayKind = 'official' | 'traditional' | 'lunar-day';

export interface VnHoliday {
  /** Solar date, `YYYY-MM-DD`. */
  date: string;
  name: string;
  kind: HolidayKind;
  /** Which calendar the rule is defined in. */
  calendar: 'solar' | 'lunar';
  lunar: LunarDate;
  note?: string;
}

const TET_SCHEDULE_NOTE =
  'Luật quy định nghỉ Tết 5 ngày; lịch nghỉ cụ thể (ngày thứ 5, hoán đổi, nghỉ bù) do Thủ tướng công bố hằng năm.';
const NATIONAL_DAY_NOTE =
  'Nghỉ 2 ngày: 2/9 và 1 ngày liền kề trước hoặc sau (1/9 hoặc 3/9) do Thủ tướng công bố hằng năm.';

/** `fromYear`: first solar year the holiday applies (no entry before it). */
interface SolarRule { month: number; day: number; name: string; note?: string; fromYear?: number }
interface LunarRule { month: number; day: number; name: string; kind: Exclude<HolidayKind, 'lunar-day'>; note?: string }

const SOLAR_OFFICIAL: readonly SolarRule[] = [
  { month: 1, day: 1, name: 'Tết Dương lịch' },
  { month: 4, day: 30, name: 'Ngày Giải phóng miền Nam, thống nhất đất nước' },
  { month: 5, day: 1, name: 'Ngày Quốc tế Lao động' },
  { month: 9, day: 2, name: 'Quốc khánh', note: NATIONAL_DAY_NOTE },
  {
    month: 11, day: 24, name: 'Ngày Văn hóa Việt Nam', fromYear: 2026,
    note: 'Ngày nghỉ lễ từ năm 2026 theo Nghị quyết 28/2026/QH16 (hiệu lực 1/7/2026).',
  },
];

const LUNAR_RULES: readonly LunarRule[] = [
  { month: 1, day: 1, name: 'Tết Nguyên Đán (mùng 1)', kind: 'official', note: TET_SCHEDULE_NOTE },
  { month: 1, day: 2, name: 'Tết Nguyên Đán (mùng 2)', kind: 'official', note: TET_SCHEDULE_NOTE },
  { month: 1, day: 3, name: 'Tết Nguyên Đán (mùng 3)', kind: 'official', note: TET_SCHEDULE_NOTE },
  { month: 1, day: 15, name: 'Tết Nguyên Tiêu (rằm tháng Giêng)', kind: 'traditional' },
  { month: 3, day: 10, name: 'Giỗ Tổ Hùng Vương', kind: 'official' },
  { month: 7, day: 15, name: 'Lễ Vu Lan (rằm tháng Bảy)', kind: 'traditional' },
  { month: 8, day: 15, name: 'Tết Trung thu', kind: 'traditional' },
  { month: 12, day: 23, name: 'Ông Công ông Táo', kind: 'traditional' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const solarYearOf = (iso: string) => Number(iso.slice(0, 4));
const byDate = (a: VnHoliday, b: VnHoliday) => a.date.localeCompare(b.date);

function lunarEntry(lunar: LunarDate, name: string, kind: HolidayKind, note?: string): VnHoliday | null {
  const date = lunarToSolar(lunar);
  return date === null ? null : { date, name, kind, calendar: 'lunar', lunar, ...(note ? { note } : {}) };
}

/** Named lunar holidays of one lunar year, including Tất niên (last day of tháng Chạp). */
function namedLunarHolidays(lunarYear: number): VnHoliday[] {
  const entries = LUNAR_RULES.map(rule =>
    lunarEntry({ day: rule.day, month: rule.month, year: lunarYear, leap: false }, rule.name, rule.kind, rule.note));
  const lastDay = lunarMonthLength(lunarYear, 12);
  if (lastDay !== null) {
    entries.push(lunarEntry({ day: lastDay, month: 12, year: lunarYear, leap: false },
      'Tất niên (ngày cuối năm âm lịch)', 'official', TET_SCHEDULE_NOTE));
  }
  return entries.filter((entry): entry is VnHoliday => entry !== null);
}

/** Mùng 1 and rằm of every month (leap months included) of one lunar year. */
function monthlyLunarDays(lunarYear: number): VnHoliday[] {
  const entries: VnHoliday[] = [];
  for (let month = 1; month <= 12; month++) {
    for (const leap of [false, true]) {
      for (const day of [1, 15]) {
        const lunar = { day, month, year: lunarYear, leap };
        const label = day === 1 ? 'Mùng 1' : 'Rằm';
        const entry = lunarEntry(lunar, `${label} tháng ${month}${leap ? ' nhuận' : ''}`, 'lunar-day');
        if (entry) entries.push(entry);
      }
    }
  }
  return entries;
}

/** All holidays whose solar date falls in solar year `year`, sorted by date. */
export function holidaysInYear(year: number): VnHoliday[] {
  if (!Number.isInteger(year)) return [];
  const solar = SOLAR_OFFICIAL.flatMap(rule => {
    if (rule.fromYear !== undefined && year < rule.fromYear) return [];
    const date = `${String(year).padStart(4, '0')}-${pad(rule.month)}-${pad(rule.day)}`;
    const lunar = solarToLunar(date);
    if (lunar === null) return [];
    const entry: VnHoliday = { date, name: rule.name, kind: 'official', calendar: 'solar', lunar };
    return [rule.note ? { ...entry, note: rule.note } : entry];
  });
  // A solar year overlaps the end of lunar year (year - 1) and most of lunar year `year`.
  const named = [year - 1, year].flatMap(namedLunarHolidays).filter(h => solarYearOf(h.date) === year);
  const namedLunarDates = new Set(named.map(h => h.date));
  const monthly = [year - 1, year].flatMap(monthlyLunarDays)
    .filter(h => solarYearOf(h.date) === year && !namedLunarDates.has(h.date));
  return [...solar, ...named, ...monthly].sort(byDate);
}

/** Holidays between two `YYYY-MM-DD` dates, both inclusive. */
export function holidaysBetween(from: string, to: string): VnHoliday[] {
  if (from > to) return [];
  const result: VnHoliday[] = [];
  for (let year = solarYearOf(from); year <= solarYearOf(to); year++) {
    result.push(...holidaysInYear(year).filter(h => h.date >= from && h.date <= to));
  }
  return result;
}

/** Holidays on one `YYYY-MM-DD` date (an empty array for an ordinary day). */
export function holidaysOn(date: string): VnHoliday[] {
  return holidaysBetween(date, date);
}

export interface UpcomingHoliday {
  holiday: VnHoliday;
  /** Whole days from `today` (0 = today). */
  daysLeft: number;
}

const TET_NEW_YEAR = 'Tết Nguyên Đán';
const isTetDay = (h: VnHoliday) => h.calendar === 'lunar' && h.lunar.month === 1 && h.lunar.day <= 3;
const isTetEve = (h: VnHoliday) => h.calendar === 'lunar' && h.lunar.month === 12 && h.name.startsWith('Tất niên');

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return jdFromDate(td, tm, ty) - jdFromDate(fd, fm, fy);
}

/**
 * The next `count` named holidays (official or traditional; mùng 1/rằm excluded) on or after `today`.
 * Tết counts once: Tất niên and mùng 1–3 collapse into a single "Tết Nguyên Đán" entry on mùng 1
 * (or on the first remaining Tết day once mùng 1 has passed).
 */
export function upcomingHolidays(today: string, count = 3): UpcomingHoliday[] {
  const year = Number(today.slice(0, 4));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || count <= 0) return [];
  const result: UpcomingHoliday[] = [];
  const tetYears = new Set<number>();
  const listed = (h: VnHoliday) => h.kind !== 'lunar-day' && h.date >= today && !isTetEve(h);
  for (const candidate of [year, year + 1, year + 2].flatMap(holidaysInYear).filter(listed)) {
    if (result.length >= count) break;
    const tet = isTetDay(candidate);
    if (tet && tetYears.has(candidate.lunar.year)) continue;
    if (tet) tetYears.add(candidate.lunar.year);
    const holiday = tet ? { ...candidate, name: TET_NEW_YEAR } : candidate;
    result.push({ holiday, daysLeft: daysBetween(today, candidate.date) });
  }
  return result;
}

/** True when the date is a statutory day off (kind `official`). */
export function isOfficialHoliday(date: string): boolean {
  return holidaysOn(date).some(h => h.kind === 'official');
}
