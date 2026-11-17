/** Mirrors TravelHub.Api.Features.Hotels DTOs. Prices are partner references, never availability. */
export interface HotelSummary {
  id: string;
  name: string;
  city: string;
  address: string | null;
  starRating: number | null;
  description: string | null;
  referencePricePerNight: number | null;
}

export interface RoomType {
  id: string;
  name: string;
  maxGuests: number;
  description: string | null;
  referencePricePerNight: number | null;
  offerTerms: string | null;
}

export interface HotelAmenity {
  code: string;
  name: string;
  /** Stable group code, e.g. "wellness"; labels live in lib/hotel-amenities. */
  category: string;
  isHighlight: boolean;
  /** Charged on top of the room price. */
  isPaid: boolean;
}

export interface HotelPolicy {
  type: string;
  content: string;
}

export interface HouseRules {
  /** "HH:mm" Vietnam time, null when the partner has not said. */
  checkInFrom: string | null;
  checkOutUntil: string | null;
  policies: HotelPolicy[];
}

export interface HotelDetail {
  hotel: HotelSummary;
  roomTypes: RoomType[];
  amenities: HotelAmenity[];
  houseRules: HouseRules;
}

export interface Stay {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}
