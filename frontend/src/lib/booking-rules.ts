import type {
  BookingDetail, BookingItemStatus, BookingSummary, PassengerInput, PassengerType, ServiceType,
} from "@/types/booking";

export const MAX_TOUR_TRAVELERS = 20;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 160;

export const SERVICE_LABELS: Record<ServiceType, string> = {
  tour: "Tour trọn gói",
  hotel: "Khách sạn",
  flight: "Vé máy bay",
};

export const PASSENGER_LABELS: Record<PassengerType, string> = { adult: "Người lớn", child: "Trẻ em" };

export type StatusTone = "info" | "warning" | "success" | "danger" | "neutral";

/** Customer-facing wording: partner quotes are never presented as confirmed until they are. */
export const ITEM_STATUS: Record<BookingItemStatus, { label: string; tone: StatusTone; hint: string }> = {
  pending: {
    label: "Đang giữ chỗ, chờ thanh toán", tone: "info",
    hint: "Chỗ chỉ được giữ trong thời gian đếm ngược. Thanh toán trước khi hết giờ để xác nhận đơn.",
  },
  awaiting_supplier: {
    label: "Chờ đối tác xác nhận", tone: "warning",
    hint: "Giá hợp đồng đã ghi trên đơn. Đơn chỉ có hiệu lực khi đối tác xác nhận còn chỗ.",
  },
  awaiting_payment: {
    label: "Chờ thanh toán", tone: "info",
    hint: "Đối tác đã xác nhận còn chỗ. Vui lòng thanh toán để hoàn tất đơn.",
  },
  confirmed: { label: "Đã xác nhận", tone: "success", hint: "Dịch vụ đã được xác nhận." },
  completed: { label: "Đã hoàn thành", tone: "neutral", hint: "Dịch vụ đã sử dụng xong." },
  cancelled: { label: "Đã hủy", tone: "danger", hint: "Đơn đã hủy, chỗ giữ (nếu có) đã được trả lại." },
  failed: { label: "Đối tác từ chối", tone: "danger", hint: "Đối tác không còn chỗ ở mức giá này." },
};

export const ITEM_STATUS_OPTIONS = Object.entries(ITEM_STATUS)
  .map(([value, meta]) => ({ value: value as BookingItemStatus, label: meta.label }));

export function itemStatusMeta(status: string) {
  return ITEM_STATUS[status as BookingItemStatus] ?? { label: status, tone: "neutral" as const, hint: "" };
}

/**
 * Mirrors BookingLifecycle.HoldsSeats: tours, and flight deals (orders with a hold deadline), hold seats until
 * the payment deadline; hotels and ordinary flight quotes wait for the partner instead.
 */
export function holdsSeats(booking: Pick<BookingSummary, "serviceType" | "holdExpiresAt">): boolean {
  return booking.serviceType === "tour" || booking.holdExpiresAt !== null;
}

/**
 * Index into the tour checkout steps (0 chọn tour … 3 hoàn tất); null when the step bar does not apply.
 * Flight deals also hold seats, but the step labels and trust notes speak of tours, so only tours get them.
 */
export function tourCheckoutStep(
  booking: Pick<BookingDetail, "serviceType" | "status" | "paidAt" | "canPay">,
): number | null {
  if (booking.serviceType !== "tour" || booking.status === "cancelled") return null;
  if (booking.paidAt !== null || booking.status === "confirmed" || booking.status === "completed") return 3;
  return booking.canPay ? 2 : 1;
}

export function emptyPassengers(adults: number, children: number): PassengerInput[] {
  const make = (passengerType: PassengerType): PassengerInput => ({ fullName: "", passengerType, birthDate: null });
  return [...Array.from({ length: adults }, () => make("adult")), ...Array.from({ length: children }, () => make("child"))];
}

/** Keeps names already typed when the traveller counts change. */
export function resizePassengers(current: PassengerInput[], adults: number, children: number): PassengerInput[] {
  const pick = (type: PassengerType, count: number) => {
    const existing = current.filter(passenger => passenger.passengerType === type).slice(0, count);
    return [...existing, ...emptyPassengers(type === "adult" ? count - existing.length : 0,
      type === "child" ? count - existing.length : 0)];
  };
  return [...pick("adult", adults), ...pick("child", children)];
}

export function nameIssue(name: string): string | null {
  const length = name.trim().length;
  return length < MIN_NAME_LENGTH || length > MAX_NAME_LENGTH ? "Họ tên cần từ 2 đến 160 ký tự." : null;
}

export function passengersIssue(passengers: PassengerInput[]): string | null {
  const index = passengers.findIndex(passenger => nameIssue(passenger.fullName));
  return index < 0 ? null : `Vui lòng nhập họ tên hợp lệ cho khách thứ ${index + 1}.`;
}

export function trimPassengers(passengers: PassengerInput[]): PassengerInput[] {
  return passengers.map(passenger => ({ ...passenger, fullName: passenger.fullName.trim() }));
}
