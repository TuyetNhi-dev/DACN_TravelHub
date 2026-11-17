import { flightSearchParams } from "@/lib/flight-search";
import { vietnamDay } from "@/lib/format";
import type { FlightDeal, FlightOffer } from "@/types/flight";

/** Departure airports offered as filter chips on /flights/deals; "" means every airport. */
export const DEAL_ORIGINS = [
  { code: "", label: "Tất cả điểm đi" }, { code: "SGN", label: "TP. Hồ Chí Minh" },
  { code: "HAN", label: "Hà Nội" }, { code: "DAD", label: "Đà Nẵng" }, { code: "PQC", label: "Phú Quốc" },
  { code: "CXR", label: "Nha Trang" }, { code: "HPH", label: "Hải Phòng" },
] as const;

/** Matches FlightDeals.WindowDays on the server. */
export const DEAL_WINDOW_DAYS = 30;

/** Only a known chip code is used; anything else in the URL falls back to every airport. */
export function dealOrigin(raw: string | undefined): string {
  return DEAL_ORIGINS.some(origin => origin.code === raw) ? (raw as string) : "";
}

/** Results page for the deal's route and departure day, where the price strip and month calendar show. */
export function dealSearchHref(deal: FlightDeal): string {
  return "/flights?" + flightSearchParams({
    from: deal.originCode, to: deal.destinationCode, date: vietnamDay(deal.departAt), passengers: 1,
    cabin: deal.cabinClass,
  });
}

/** At or below this many seats a deal is shown as running out. */
export const DEAL_LOW_SEATS = 5;

/** A deal comes from SàiHành's seat allotment: confirmed on payment, no partner check. */
export function isDeal(offer: Pick<FlightOffer, "remainingSeats">): boolean {
  return offer.remainingSeats !== null;
}

export function seatsLeftLabel(seats: number): string {
  return `Còn ${seats} ghế giá này`;
}

/** Why a deal cannot take this many passengers, or null when it can (or is not a deal). */
export function seatShortage(offer: Pick<FlightOffer, "remainingSeats">, passengers: number): string | null {
  const seats = offer.remainingSeats;
  return seats !== null && seats < passengers ? `Chỉ còn ${seats} ghế giá này, không đủ ${passengers} khách.` : null;
}
