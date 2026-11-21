import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { invalid, isoDate, isRecord, itemEnvelope, list, num, optNum, optStr, str, type Row } from "@/lib/decode";
import type { Cart, CartChoice, CartItem, CartItemStatus, GuestCartLine, MergedCart } from "@/types/cart";

const RESOURCE = "giỏ hàng";
const STATUSES: readonly CartItemStatus[] = ["ok", "price_changed", "not_enough_seats", "sold_out", "unavailable"];

function status(row: Row): CartItemStatus {
  const value = str(row, "status", RESOURCE);
  return (STATUSES as readonly string[]).includes(value) ? (value as CartItemStatus) : invalid(RESOURCE);
}

function decodeItem(row: Row): CartItem {
  return {
    id: optStr(row, "id", RESOURCE),
    departureId: str(row, "departureId", RESOURCE),
    tourId: str(row, "tourId", RESOURCE),
    tourCode: str(row, "tourCode", RESOURCE),
    tourTitle: str(row, "tourTitle", RESOURCE),
    destination: str(row, "destination", RESOURCE),
    imageUrl: optStr(row, "imageUrl", RESOURCE),
    imageAlt: optStr(row, "imageAlt", RESOURCE),
    departureFrom: str(row, "departureFrom", RESOURCE),
    departureDate: isoDate(row, "departureDate", RESOURCE),
    returnDate: isoDate(row, "returnDate", RESOURCE),
    adultCount: num(row, "adultCount", RESOURCE),
    childCount: num(row, "childCount", RESOURCE),
    adultPrice: num(row, "adultPrice", RESOURCE),
    childPrice: num(row, "childPrice", RESOURCE),
    adultPriceSeen: num(row, "adultPriceSeen", RESOURCE),
    childPriceSeen: optNum(row, "childPriceSeen", RESOURCE),
    availableSeats: num(row, "availableSeats", RESOURCE),
    status: status(row),
    subtotal: num(row, "subtotal", RESOURCE),
    updatedAt: str(row, "updatedAt", RESOURCE),
  };
}

export function decodeCart(row: Row): Cart {
  return {
    items: list(row.items, decodeItem, RESOURCE),
    estimatedTotal: num(row, "estimatedTotal", RESOURCE),
    maxItems: num(row, "maxItems", RESOURCE),
  };
}

function decodeMerged(row: Row): MergedCart {
  return {
    cart: isRecord(row.cart) ? decodeCart(row.cart) : invalid(RESOURCE),
    notMoved: num(row, "notMoved", RESOURCE),
  };
}

const cart = (value: unknown) => itemEnvelope(value, decodeCart, RESOURCE);

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  return cart(await apiGet("/api/cart", signal));
}

export async function saveCartItem(choice: CartChoice): Promise<Cart> {
  return cart(await apiPost("/api/cart/items", choice));
}

export async function deleteCartItem(id: string): Promise<Cart> {
  return cart(await apiDelete(`/api/cart/items/${encodeURIComponent(id)}`));
}

/** Live prices and seats for a guest cart; nothing is stored on the server. */
export async function quoteGuestCart(items: GuestCartLine[], signal?: AbortSignal): Promise<Cart> {
  return cart(await apiPost("/api/cart/quote", { items }, signal));
}

/** After sign-in: moves the guest cart into the account (the newer version of a line wins). */
export async function mergeGuestCart(items: GuestCartLine[]): Promise<MergedCart> {
  return itemEnvelope(await apiPost("/api/cart/merge", { items }), decodeMerged, RESOURCE);
}
