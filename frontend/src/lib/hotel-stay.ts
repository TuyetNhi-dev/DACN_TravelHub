import { vietnamToday } from "@/lib/format";
import type { RoomType, Stay } from "@/types/hotel";

export const MAX_NIGHTS = 30;
export const MAX_ROOMS = 10;
export const MAX_GUESTS = 40;
const DAY_MS = 86_400_000;

function dayValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date.getTime();
}

export function stayNights(stay: Pick<Stay, "checkIn" | "checkOut">): number {
  const start = dayValue(stay.checkIn);
  const end = dayValue(stay.checkOut);
  return start === null || end === null || end <= start ? 0 : (end - start) / DAY_MS;
}

/** Mirrors BookingRequestValidator.Hotel on the server so users see problems before submitting. */
export function validateStay(stay: Stay, today = vietnamToday()): string | null {
  if (dayValue(stay.checkIn) === null || dayValue(stay.checkOut) === null)
    return "Vui lòng chọn ngày nhận và trả phòng.";
  if (stay.checkIn < today) return "Ngày nhận phòng không được ở trong quá khứ.";
  const nights = stayNights(stay);
  if (!nights) return "Ngày trả phòng phải sau ngày nhận phòng.";
  if (nights > MAX_NIGHTS) return `Mỗi lần đặt tối đa ${MAX_NIGHTS} đêm.`;
  if (!Number.isInteger(stay.rooms) || stay.rooms < 1 || stay.rooms > MAX_ROOMS)
    return `Số phòng từ 1 đến ${MAX_ROOMS}.`;
  if (!Number.isInteger(stay.guests) || stay.guests < stay.rooms || stay.guests > MAX_GUESTS)
    return "Mỗi phòng cần ít nhất một khách.";
  return null;
}

export function roomIssue(room: RoomType, stay: Stay, today = vietnamToday()): string | null {
  const issue = validateStay(stay, today);
  if (issue) return issue;
  if (stay.guests > room.maxGuests * stay.rooms)
    return `Loại phòng này tối đa ${room.maxGuests} khách/phòng. Vui lòng tăng số phòng.`;
  if (room.referencePricePerNight === null) return "Đối tác chưa có giá cho loại phòng này.";
  return null;
}

/** Estimate only; the server recalculates from the offer valid for the whole stay. */
export function stayEstimate(room: RoomType, stay: Stay): number | null {
  const nights = stayNights(stay);
  return room.referencePricePerNight === null || !nights ? null : room.referencePricePerNight * nights * stay.rooms;
}

export function defaultStay(today = vietnamToday()): Stay {
  const checkIn = addDays(today, 1);
  return { checkIn, checkOut: addDays(checkIn, 1), guests: 2, rooms: 1 };
}

export function addDays(isoDay: string, days: number): string {
  const value = dayValue(isoDay);
  return value === null ? "" : new Date(value + days * DAY_MS).toISOString().slice(0, 10);
}

export function stayParams(stay: Stay): URLSearchParams {
  return new URLSearchParams({
    checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests), rooms: String(stay.rooms),
  });
}

export function parseStay(params: Record<string, string | string[] | undefined>, today = vietnamToday()): Stay {
  const fallback = defaultStay(today);
  const text = (key: string) => (typeof params[key] === "string" ? (params[key] as string).slice(0, 10) : "");
  const count = (key: string, otherwise: number) => {
    const value = Number(text(key));
    return Number.isSafeInteger(value) && value > 0 ? value : otherwise;
  };
  return {
    checkIn: text("checkIn") || fallback.checkIn,
    checkOut: text("checkOut") || fallback.checkOut,
    guests: count("guests", fallback.guests),
    rooms: count("rooms", fallback.rooms),
  };
}
