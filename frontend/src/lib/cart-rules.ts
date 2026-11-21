import { formatCurrency } from "@/lib/format";
import type { CartChoice, CartItem, CartItemStatus, GuestCartLine } from "@/types/cart";

/** Same limit as CartLimits.MaxItems on the server. */
export const MAX_CART_ITEMS = 10;
/** Same group limit as BookingLimits.MaxTourTravelers. */
const MAX_TRAVELERS = 20;
const RESOURCE_ID = /^[1-9]\d{0,19}$/;

export type CartAddResult = { lines: GuestCartLine[] } | { error: string };

export const CART_FULL_MESSAGE =
  `Giỏ hàng đã đủ ${MAX_CART_ITEMS} món. Vui lòng xóa bớt hoặc đặt các món đang có.`;

/** Lines from localStorage may be stale, edited or from an older version: anything malformed is dropped. */
export function parseGuestCart(raw: string | null): GuestCartLine[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    // Corrupt storage means an empty cart, not a broken page.
    return [];
  }
  return Array.isArray(value) ? value.filter(isGuestLine).slice(0, MAX_CART_ITEMS) : [];
}

function isGuestLine(value: unknown): value is GuestCartLine {
  if (value === null || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.departureId === "string" && RESOURCE_ID.test(line.departureId)
    && validCounts(line.adultCount, line.childCount)
    && isPriceOrNull(line.adultPriceSeen) && isPriceOrNull(line.childPriceSeen)
    && typeof line.updatedAt === "string" && !Number.isNaN(Date.parse(line.updatedAt));
}

function validCounts(adults: unknown, children: unknown): boolean {
  return typeof adults === "number" && typeof children === "number"
    && Number.isInteger(adults) && Number.isInteger(children)
    && adults >= 1 && children >= 0 && adults + children <= MAX_TRAVELERS;
}

function isPriceOrNull(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

/** Adding a departure already in the cart replaces it and moves it to the top; a new one needs a free place. */
export function addGuestLine(lines: GuestCartLine[], line: GuestCartLine): CartAddResult {
  const others = lines.filter(existing => existing.departureId !== line.departureId);
  if (others.length === lines.length && lines.length >= MAX_CART_ITEMS) return { error: CART_FULL_MESSAGE };
  return { lines: [line, ...others] };
}

export function removeGuestLine(lines: GuestCartLine[], departureId: string): GuestCartLine[] {
  return lines.filter(line => line.departureId !== departureId);
}

export function guestLine(choice: CartChoice, adultPrice: number, childPrice: number | null, now: Date): GuestCartLine {
  return { ...choice, adultPriceSeen: adultPrice, childPriceSeen: childPrice, updatedAt: now.toISOString() };
}

export function canBook(status: CartItemStatus): boolean {
  return status === "ok" || status === "price_changed";
}

/** Warning shown on a line, or null when nothing changed since it was added. */
export function cartWarning(item: CartItem): string | null {
  const travelers = item.adultCount + item.childCount;
  switch (item.status) {
    case "unavailable": return "Lịch khởi hành này không còn nhận khách. Vui lòng xóa hoặc chọn ngày khác.";
    case "sold_out": return "Lịch khởi hành này đã hết chỗ.";
    case "not_enough_seats":
      return `Chỉ còn ${item.availableSeats} chỗ, ít hơn ${travelers} khách bạn chọn.`;
    case "price_changed": return priceChangeText(item);
    default: return null;
  }
}

function priceChangeText(item: CartItem): string {
  if (item.adultPrice === item.adultPriceSeen) return "Giá trẻ em đã thay đổi kể từ lúc bạn thêm vào giỏ.";
  const rose = item.adultPrice > item.adultPriceSeen;
  return `Giá người lớn đã ${rose ? "tăng" : "giảm"} từ ${formatCurrency(item.adultPriceSeen)} `
    + `${rose ? "lên" : "xuống"} ${formatCurrency(item.adultPrice)}.`;
}

/** "Đặt ngay" opens the tour page with the departure and head count already filled in. */
export function bookingHref(item: Pick<CartItem, "tourId" | "departureId" | "adultCount" | "childCount">): string {
  const query = new URLSearchParams({
    departure: item.departureId, adults: String(item.adultCount), children: String(item.childCount),
  });
  return `/tours/${encodeURIComponent(item.tourId)}?${query}#tour-booking`;
}

/** Reads ?departure=&adults=&children= back on the tour page; anything invalid is ignored. */
export function parseBookingPrefill(params: Record<string, string>): Partial<CartChoice> {
  const adults = Number(params.adults);
  const children = Number(params.children);
  const validAdults = Number.isInteger(adults) && adults >= 1 && adults <= MAX_TRAVELERS;
  const validChildren = Number.isInteger(children) && children >= 0 && children <= MAX_TRAVELERS;
  return {
    ...(RESOURCE_ID.test(params.departure ?? "") ? { departureId: params.departure } : {}),
    ...(validAdults ? { adultCount: adults } : {}),
    ...(validChildren && (!validAdults || adults + children <= MAX_TRAVELERS) ? { childCount: children } : {}),
  };
}
