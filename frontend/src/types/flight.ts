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
}

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearch {
  from: string;
  to: string;
  date: string;
  passengers: number;
  cabin: CabinClass;
}
