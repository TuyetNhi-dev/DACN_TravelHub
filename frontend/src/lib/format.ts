export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false,
});
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit",
  minute: "2-digit", hour12: false,
});
const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VIETNAM_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function formatCurrency(value: number | null): string {
  return value === null ? "Chưa có giá" : currencyFormatter.format(value);
}

/** "2026-11-20" → "20/11/2026". Calendar dates carry no time zone, so no conversion happens. */
export function formatDate(isoDate: string | null): string {
  return isoDate ? isoDate.split("-").reverse().join("/") : "Chưa có ngày";
}

/** UTC instant → Vietnam wall-clock time, e.g. "06:05". */
export function formatTime(utc: string): string {
  return timeFormatter.format(new Date(utc));
}

export function formatDateTime(utc: string): string {
  return dateTimeFormatter.format(new Date(utc));
}

/** UTC instant → Vietnam calendar day as "yyyy-mm-dd". */
export function vietnamDay(utc: string | Date): string {
  return isoDayFormatter.format(typeof utc === "string" ? new Date(utc) : utc);
}

export function vietnamToday(now = new Date()): string {
  return vietnamDay(now);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} giờ${rest ? ` ${rest} phút` : ""}` : `${rest} phút`;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}
