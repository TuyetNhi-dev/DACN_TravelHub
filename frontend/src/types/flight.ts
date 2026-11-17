/** Mirrors TravelHub.Api.Features.Flights.FlightOfferDto. departAt/arriveAt are UTC ISO instants. */
export interface FlightOffer {
  flightId: string;
  offerId: string;
  flightNumber: string;
  airline: string;
  airlineCode: string | null;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
  cabinClass: CabinClass;
  referencePrice: number;
  baggageTerms: string | null;
  changeCancelTerms: string | null;
  quoteExpiresAt: string | null;
  /** Set only for deals (SàiHành's seat allotment), which are confirmed on payment. */
  remainingSeats: number | null;
}

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearch {
  from: string;
  to: string;
  date: string;
  passengers: number;
  cabin: CabinClass;
  /** Set for a round trip: booked as two separate one-way orders. */
  returnDate?: string;
  /** Round trip only: show the ±3-day outbound × return price table. */
  flexible?: boolean;
}

/** Mirrors FlightDayPriceDto: the lowest reference quote on one Vietnamese departure day. */
export interface FlightDayPrice {
  date: string;
  lowestPrice: number | null;
  offerCount: number;
  isCheapest: boolean;
}

/** Mirrors FlightPriceCalendarDto; month is "yyyy-mm". */
export interface FlightPriceCalendar {
  from: string;
  to: string;
  cabin: CabinClass;
  month: string;
  cheapestPrice: number | null;
  days: FlightDayPrice[];
}

/** A route by airport codes, as the price endpoints expect it. */
export interface FlightRoute {
  from: string;
  to: string;
  cabin: CabinClass;
}

/** Mirrors RoundTripFareDto: outbound + return lowest quotes for one pair of days. */
export interface RoundTripFare {
  departDate: string;
  returnDate: string;
  total: number | null;
  isCheapest: boolean;
}

/** Mirrors FlexibleFaresDto; returnDays and roundTrips are empty for one-way searches. */
export interface FlexibleFares {
  date: string;
  returnDate: string | null;
  outboundDays: FlightDayPrice[];
  returnDays: FlightDayPrice[];
  roundTrips: RoundTripFare[];
  cheapestTotal: number | null;
}

/** Mirrors FlightDealDto: one route's headline quote on /flights/deals. */
export interface FlightDeal {
  offerId: string;
  flightId: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departAt: string;
  airline: string;
  airlineCode: string | null;
  flightNumber: string;
  cabinClass: CabinClass;
  referencePrice: number;
  isFeatured: boolean;
  quoteUpdatedAt: string;
  remainingSeats: number;
}
