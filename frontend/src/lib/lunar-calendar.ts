/**
 * Vietnamese lunisolar calendar (âm lịch), after Hồ Ngọc Đức's published algorithm
 * (https://www.informatik.uni-leipzig.de/~duc/amlich/). Astronomical new moons and solar terms are
 * evaluated for UTC+7, which is why Vietnamese dates sometimes differ from the Chinese (UTC+8) calendar
 * — e.g. Tết 1985 and 2007.
 *
 * Every function is pure and works on Julian day numbers and `YYYY-MM-DD` strings only. Nothing here
 * reads `Date`, so results never depend on the timezone of the machine running the code.
 * Valid range: solar years 1800–2199 (the algorithm's approximations are tested 1900–2100).
 */

/** Vietnam standard time, hours east of UTC. */
export const VN_TIME_ZONE = 7;

export interface LunarDate {
  day: number;
  month: number;
  /** Lunar year number; equals the solar year in which that year's Tết falls. */
  year: number;
  /** True inside a leap (nhuận) month. */
  leap: boolean;
}

const MIN_YEAR = 1800;
const MAX_YEAR = 2199;
const SYNODIC_MONTH = 29.530588853;
const EPOCH_NEW_MOON = 2415021.076998695;

// ---- Solar (Gregorian) day numbers ---------------------------------------------------------------

/** Julian day number of a Gregorian date (integer arithmetic, Gregorian from 15/10/1582). */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100)
    + Math.floor(y / 400) - 32045;
  if (jd < 2299161) return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

/** Inverse of {@link jdFromDate}: `[day, month, year]`. */
export function jdToDate(jd: number): [number, number, number] {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return [
    e - Math.floor((153 * m + 2) / 5) + 1,
    m + 3 - 12 * Math.floor(m / 10),
    b * 100 + d - 4800 + Math.floor(m / 10),
  ];
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function isoFromJd(jd: number): string {
  const [d, m, y] = jdToDate(jd);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

/** Parses a strict `YYYY-MM-DD` Gregorian date into a Julian day number, or null when invalid. */
function jdFromIso(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1) return null;
  const jd = jdFromDate(day, month, year);
  const [d, m, y] = jdToDate(jd);
  return d === day && m === month && y === year ? jd : null;
}

// ---- Astronomy ----------------------------------------------------------------------------------

/** Julian day (fractional, UT) of the k-th new moon after 1900-01-01. */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltaT = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + c1 - deltaT;
}

/** Sun's apparent longitude in radians, [0, 2π), at Julian day `jdn` (UT). */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const L = (L0 + DL) * dr;
  return L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
}

/** Solar-term sector (0–11, 30° each) at local midnight starting day `dayNumber`. */
function sunSector(dayNumber: number, timeZone: number): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
}

/** Local day number on which the k-th new moon falls. */
function newMoonDay(k: number, timeZone: number): number {
  return Math.floor(newMoon(k) + 0.5 + timeZone / 24);
}

/** Day number starting lunar month 11 (the month containing the winter solstice) of solar year `year`. */
function lunarMonth11(year: number, timeZone: number): number {
  const off = jdFromDate(31, 12, year) - 2415021;
  const k = Math.floor(off / SYNODIC_MONTH);
  const nm = newMoonDay(k, timeZone);
  return sunSector(nm, timeZone) >= 9 ? newMoonDay(k - 1, timeZone) : nm;
}

/** In a 13-month year starting at `a11`, the offset (1-based from month 11) of the leap month. */
function leapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - EPOCH_NEW_MOON) / SYNODIC_MONTH + 0.5);
  let i = 1;
  let arc = sunSector(newMoonDay(k + i, timeZone), timeZone);
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunSector(newMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

// ---- Conversions --------------------------------------------------------------------------------

function inRange(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

function lunarFromJd(dayNumber: number, timeZone: number): LunarDate {
  const [, , yy] = jdToDate(dayNumber);
  const k = Math.floor((dayNumber - EPOCH_NEW_MOON) / SYNODIC_MONTH);
  // `k` comes from the mean lunation and can overshoot the true new moon by one, so step back until
  // the month start is not after the date (the original code stops after one step; fails e.g. 2062-04-09).
  let step = k + 1;
  let monthStart = newMoonDay(step, timeZone);
  while (monthStart > dayNumber) monthStart = newMoonDay(--step, timeZone);
  let a11 = lunarMonth11(yy, timeZone);
  let b11 = a11;
  let year: number;
  if (a11 >= monthStart) {
    year = yy;
    a11 = lunarMonth11(yy - 1, timeZone);
  } else {
    year = yy + 1;
    b11 = lunarMonth11(yy + 1, timeZone);
  }
  const day = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11, timeZone);
    if (diff >= leapDiff) {
      month = diff + 10;
      leap = diff === leapDiff;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap };
}

/** Day number of the first day of a lunar month, or null when that (leap) month does not exist. */
function lunarMonthStartJd(month: number, year: number, leap: boolean, timeZone: number): number | null {
  const [a11, b11] = month < 11
    ? [lunarMonth11(year - 1, timeZone), lunarMonth11(year, timeZone)]
    : [lunarMonth11(year, timeZone), lunarMonth11(year + 1, timeZone)];
  const k = Math.floor(0.5 + (a11 - EPOCH_NEW_MOON) / SYNODIC_MONTH);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null;
  }
  return newMoonDay(k + off, timeZone);
}

/** Converts a solar `YYYY-MM-DD` date to its Vietnamese lunar date; null for invalid or out-of-range input. */
export function solarToLunar(iso: string): LunarDate | null {
  const jd = jdFromIso(iso);
  if (jd === null || !inRange(jdToDate(jd)[2])) return null;
  return lunarFromJd(jd, VN_TIME_ZONE);
}

/** Number of days (29 or 30) in a lunar month, or null when the month does not exist. */
export function lunarMonthLength(year: number, month: number, leap = false): number | null {
  if (!inRange(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  const start = lunarMonthStartJd(month, year, leap, VN_TIME_ZONE);
  if (start === null) return null;
  // The next month starts at the following new moon (29 or 30 days later).
  const k = Math.floor((start - EPOCH_NEW_MOON) / SYNODIC_MONTH + 0.5);
  return newMoonDay(k + 1, VN_TIME_ZONE) - start;
}

/**
 * Converts a Vietnamese lunar date to `YYYY-MM-DD`. Returns null when the date does not exist:
 * day outside the month's 29/30 days, or `leap: true` for a month that is not that year's leap month.
 */
export function lunarToSolar({ day, month, year, leap }: LunarDate): string | null {
  if (!Number.isInteger(day) || day < 1) return null;
  const length = lunarMonthLength(year, month, leap);
  if (length === null || day > length) return null;
  const start = lunarMonthStartJd(month, year, leap, VN_TIME_ZONE);
  return start === null ? null : isoFromJd(start + day - 1);
}

/** The leap month (1–12) of a lunar year, or null when the year has twelve months. */
export function leapMonthOf(year: number): number | null {
  if (!inRange(year)) return null;
  for (let month = 1; month <= 12; month++) {
    if (lunarMonthStartJd(month, year, true, VN_TIME_ZONE) !== null) return month;
  }
  return null;
}

/** Solar date of Tết Nguyên Đán (mùng 1 tháng Giêng) of a lunar year. */
export function tetDate(year: number): string | null {
  return lunarToSolar({ day: 1, month: 1, year, leap: false });
}

// ---- Can chi ------------------------------------------------------------------------------------

export const HEAVENLY_STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const EARTHLY_BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Can chi of a lunar year, e.g. 2025 → "Ất Tỵ". Pass the lunar year (dates before Tết belong to the previous one). */
export function yearCanChi(lunarYear: number): string {
  return `${HEAVENLY_STEMS[mod(lunarYear + 6, 10)]} ${EARTHLY_BRANCHES[mod(lunarYear + 8, 12)]}`;
}

/** Short Vietnamese label, e.g. "15/8" or "1/6 nhuận". */
export function formatLunar({ day, month, leap }: LunarDate): string {
  return `${day}/${month}${leap ? ' nhuận' : ''}`;
}
