/** Mirrors TravelHub.Api.Features.Bookings DTOs. */
export type ServiceType = "tour" | "hotel" | "flight";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type BookingItemStatus =
  | "pending"
  | "awaiting_supplier"
  | "awaiting_payment"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "failed";

export type PassengerType = "adult" | "child";

export interface PassengerInput {
  fullName: string;
  passengerType: PassengerType;
  birthDate: string | null;
}

export interface BookingCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface BookingSummary {
  id: string;
  code: string;
  serviceType: ServiceType;
  status: BookingStatus;
  itemStatus: BookingItemStatus;
  title: string;
  subtitle: string | null;
  startDate: string | null;
  total: number;
  createdAt: string;
  /** UTC instant when an unpaid tour hold is released; null for hotels, flights and paid orders. */
  holdExpiresAt: string | null;
  customer: BookingCustomer | null;
}

export interface PriceLine {
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BookingDetail extends BookingSummary {
  endDate: string | null;
  subtotal: number;
  discountTotal: number;
  supplierConfirmationCode: string | null;
  terms: string | null;
  priceLines: PriceLine[];
  passengers: PassengerInput[];
  paidAt: string | null;
  canCancel: boolean;
  canPay: boolean;
}

export interface TourBookingRequest {
  departureId: string;
  adultCount: number;
  childCount: number;
  passengers: PassengerInput[];
}

export interface HotelBookingRequest {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  guestCount: number;
  leadGuestName: string;
}

export interface FlightBookingRequest {
  offerId: string;
  passengers: PassengerInput[];
}
