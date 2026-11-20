import { getUpcomingFlights } from "@/services/flights";
import { getHotels } from "@/services/hotels";
import type { FlightOffer } from "@/types/flight";
import type { HotelSummary } from "@/types/hotel";

const HOME_HOTELS = 4;
const HOME_FLIGHTS = 6;

/** Home teaser: hotels that have a partner reference price. Never implies a room is available. */
export async function getHomeHotels(signal?: AbortSignal): Promise<HotelSummary[]> {
  const { items } = await getHotels({}, signal);
  return items.filter(hotel => hotel.referencePricePerNight !== null).slice(0, HOME_HOTELS);
}

/** Home teaser: one reference fare per route (the cheapest), so the strip shows different routes. */
export async function getHomeFlights(signal?: AbortSignal): Promise<FlightOffer[]> {
  const flights = await getUpcomingFlights(signal);
  const cheapest = new Map<string, FlightOffer>();
  for (const flight of flights) {
    const route = `${flight.originCode}-${flight.destinationCode}`;
    const current = cheapest.get(route);
    if (!current || flight.referencePrice < current.referencePrice) cheapest.set(route, flight);
  }
  return [...cheapest.values()].slice(0, HOME_FLIGHTS);
}
