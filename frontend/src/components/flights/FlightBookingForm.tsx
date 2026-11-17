"use client";

import { useState, type FormEvent } from "react";
import { ContactDetails, MissingPhoneHint, useHasContactPhone } from "@/components/bookings/ContactDetails";
import { PassengerFields } from "@/components/bookings/PassengerFields";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { emptyPassengers, passengersIssue, trimPassengers } from "@/lib/booking-rules";
import { flightTotal } from "@/lib/flight-search";
import { formatCurrency } from "@/lib/format";
import { createFlightBooking } from "@/services/bookings";
import type { BookingDetail, PassengerInput } from "@/types/booking";
import type { FlightOffer } from "@/types/flight";
import { isDeal, seatShortage } from "@/lib/flight-deals";
import { DealNotice } from "./DealBadges";
import { FlightCard } from "./FlightCard";

interface FlightBookingFormProps {
  offer: FlightOffer;
  passengers: number;
  submitLabel?: string;
  /** Keeps the user on the page (round trip); otherwise the new order opens. */
  onCreated?: (booking: BookingDetail, passengers: PassengerInput[]) => void;
}

export function FlightBookingForm({ offer, passengers: count, submitLabel, onCreated }: FlightBookingFormProps) {
  const [passengers, setPassengers] = useState(() => emptyPassengers(count, 0));
  const { submit, busy, error, setError } = useBookingSubmit();
  const hasPhone = useHasContactPhone();
  const deal = isDeal(offer);
  const shortage = seatShortage(offer, count);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = passengers.some(passenger => passenger.passengerType === "adult")
      ? passengersIssue(passengers)
      : "Cần ít nhất một hành khách người lớn.";
    if (issue) { setError(issue); return; }
    const trimmed = trimPassengers(passengers);
    void submit(() => createFlightBooking({ offerId: offer.offerId, passengers: trimmed }),
      onCreated && (booking => onCreated(booking, trimmed)));
  }

  return (
    <form className="sh-two-column" onSubmit={handleSubmit}>
      <div>
        <FlightCard offer={offer} passengers={count} showTerms />
        <section className="sh-panel">
          <h2>Thông tin hành khách</h2>
          <p className="sh-hotel-caption">Nhập đúng họ tên như trên CCCD/hộ chiếu. Cần ít nhất một người lớn.</p>
          <PassengerFields passengers={passengers} onChange={setPassengers} idPrefix="flight-passenger"
            typeEditable />
        </section>
        <ContactDetails />
      </div>
      <aside className="sh-panel sh-sticky" aria-label="Tóm tắt yêu cầu">
        <h2>Tóm tắt</h2>
        <PriceSummary
          lines={[
            { label: deal ? "Giá deal / khách" : "Giá tham khảo / khách", value: formatCurrency(offer.referencePrice) },
            { label: "Số hành khách", value: String(count) },
          ]}
          total={flightTotal(offer, count)}
        />
        {deal ? <DealNotice /> : <QuoteNotice service="flight" />}
        {shortage && <p className="sh-error" role="alert">{shortage}</p>}
        {error && <p className="sh-error" role="alert">{error}</p>}
        {!hasPhone && <MissingPhoneHint />}
        <button className="btn btn-primary" type="submit" disabled={busy || !hasPhone || shortage !== null}>
          {busy ? "Đang gửi…" : submitLabel ?? (deal ? "Giữ ghế và thanh toán" : "Gửi yêu cầu đặt vé")}
        </button>
      </aside>
    </form>
  );
}
