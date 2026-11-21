/** Mirrors TravelHub.Api.Features.Cart DTOs. A cart line is a choice only: no seats held, no price locked. */
export type CartItemStatus = "ok" | "price_changed" | "not_enough_seats" | "sold_out" | "unavailable";

export interface CartItem {
  /** Null for a guest cart (kept in the browser). */
  id: string | null;
  departureId: string;
  tourId: string;
  tourCode: string;
  tourTitle: string;
  destination: string;
  imageUrl: string | null;
  imageAlt: string | null;
  departureFrom: string;
  departureDate: string;
  returnDate: string;
  adultCount: number;
  childCount: number;
  /** Live prices; the child price already falls back to the adult price. */
  adultPrice: number;
  childPrice: number;
  /** Prices when the line was added, only to warn about a change. */
  adultPriceSeen: number;
  childPriceSeen: number | null;
  availableSeats: number;
  status: CartItemStatus;
  subtotal: number;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  estimatedTotal: number;
  maxItems: number;
}

export interface MergedCart {
  cart: Cart;
  /** Guest lines that could not be moved (no longer bookable, or the cart was full). */
  notMoved: number;
}

/** What "Thêm vào giỏ" sends. */
export interface CartChoice {
  departureId: string;
  adultCount: number;
  childCount: number;
}

/** One line of the guest cart in localStorage. */
export interface GuestCartLine extends CartChoice {
  adultPriceSeen: number | null;
  childPriceSeen: number | null;
  /** ISO time of the last change; the newer side wins when merging at sign-in. */
  updatedAt: string;
}
