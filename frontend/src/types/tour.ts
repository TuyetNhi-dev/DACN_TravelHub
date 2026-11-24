/** Mirrors TravelHub.Api.Features.Tours DTOs. Dates are Vietnamese calendar days "yyyy-mm-dd". */
/** GET /api/tours/destinations: destinations with at least one published tour. */
export interface TourDestination {
  id: string;
  name: string;
  tourCount: number;
}

/** One day of the /tours date filter (GET /api/tours/departure-days). */
export interface TourDayCount {
  date: string;
  tourCount: number;
}

/** One tour among the search box suggestions (GET /api/tours/suggest). */
export interface TourSuggestion {
  id: string;
  code: string;
  title: string;
  destination: string;
  basePrice: number;
}

export interface TourSuggestions {
  destinations: TourDestination[];
  tours: TourSuggestion[];
}

export interface TourSummary {
  id: string;
  code: string;
  title: string;
  destination: string;
  departureFrom: string | null;
  durationDays: number;
  durationNights: number;
  transport: string | null;
  basePrice: number;
  description: string | null;
  upcomingDepartureDates: string[];
}

/**
 * Mirrors UpcomingDepartureDto: one bookable departure leaving soon. Seats are counted when the API answers;
 * daysUntilDeparture is counted by the server from today in Vietnam.
 */
export interface UpcomingDeparture {
  departureId: string;
  tourId: string;
  tourCode: string;
  tourTitle: string;
  destination: string;
  departureFrom: string;
  departureDate: string;
  durationDays: number;
  durationNights: number;
  availableSeats: number;
  adultPrice: number;
  daysUntilDeparture: number;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string | null;
}

export interface TourDeparture {
  id: string;
  departureFrom: string;
  departureDate: string;
  returnDate: string;
  capacity: number;
  availableSeats: number;
  adultPrice: number;
  childPrice: number | null;
  status: string;
  isBookable: boolean;
}

/** Mirrors TourImageDto; the first photo of a tour is its cover. */
export interface TourImage {
  url: string;
  alt: string | null;
}

/** Mirrors TourInclusionsDto: "Giá tour bao gồm" / "Không bao gồm", each in display order. */
export interface TourInclusions {
  included: string[];
  excluded: string[];
}

export interface TourDetail {
  tour: TourSummary;
  itinerary: ItineraryDay[];
  departures: TourDeparture[];
  images: TourImage[];
  inclusions: TourInclusions;
}

/** Mirrors TourCollectionDto: a seasonal or themed group of tours. */
export interface TourCollection {
  slug: string;
  name: string;
  tagline: string | null;
  seasonLabel: string | null;
  /** Place whose photos represent the collection. */
  coverPlace: string | null;
  tourCount: number;
}

export interface TourCollectionDetail {
  collection: TourCollection;
  tours: TourSummary[];
}
