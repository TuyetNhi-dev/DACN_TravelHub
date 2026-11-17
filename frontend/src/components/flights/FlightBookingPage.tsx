"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ContactDetails, MissingPhoneHint, useHasContactPhone } from "@/components/bookings/ContactDetails";
import { LoginPrompt } from "@/components/bookings/LoginPrompt";
import { PassengerFields } from "@/components/bookings/PassengerFields";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { useResource } from "@/hooks/useResource";
import { emptyPassengers, passengersIssue, trimPassengers } from "@/lib/booking-rules";
import { airportCode, flightSearchParams, flightTotal } from "@/lib/flight-search";
import { formatCurrency } from "@/lib/format";
import { createFlightBooking } from "@/services/bookings";
import { searchFlights } from "@/services/flights";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlightCard } from "./FlightCard";

/** Re-runs the search to confirm the chosen quote is still sellable before showing the form. */
export function FlightBookingPage({ search, offerId }: { search: FlightSearch; offerId: string }) {
  const query = { from: airportCode(search.from), to: airportCode(search.to), date: search.date, cabin: search.cabin };
  const { state, retry } = useResource(`flight-offer:${offerId}`, async signal =>
    (await searchFlights(query, signal)).find(offer => offer.offerId === offerId) ?? null);
  const { session, loading } = useAuth();
  const resultsHref = "/flights?" + flightSearchParams(search);
  return (
    <main id="main-content" className="sf">
      <div className="container sf-body sh-page">
        <Breadcrumb items={[
          { label: "Vé máy bay", href: "/flights" }, { label: "Kết quả", href: resultsHref },
          { label: "Gửi yêu cầu đặt vé" },
        ]} />
        {state.status === "loading" && <LoadingState label="Đang kiểm tra báo giá…" />}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} backHref={resultsHref} />}
        {state.status === "ready" && state.data === null && (
          <EmptyState title="Báo giá không còn hiệu lực">
            <p>Chuyến bay đã hết hạn báo giá hoặc ngừng bán. Vui lòng chọn chuyến khác.</p>
          </EmptyState>
        )}
        {state.status === "ready" && state.data !== null && (
          loading ? <p role="status">Đang kiểm tra phiên đăng nhập…</p>
            : !session ? <LoginPrompt action="gửi yêu cầu đặt vé" />
              : <FlightBookingForm offer={state.data} passengers={search.passengers} />
        )}
      </div>
    </main>
  );
}

function FlightBookingForm({ offer, passengers: count }: { offer: FlightOffer; passengers: number }) {
  const [passengers, setPassengers] = useState(() => emptyPassengers(count, 0));
  const { submit, busy, error, setError } = useBookingSubmit();
  const hasPhone = useHasContactPhone();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = passengers.some(passenger => passenger.passengerType === "adult")
      ? passengersIssue(passengers)
      : "Cần ít nhất một hành khách người lớn.";
    if (issue) { setError(issue); return; }
    void submit(() => createFlightBooking({ offerId: offer.offerId, passengers: trimPassengers(passengers) }));
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
            { label: "Giá tham khảo / khách", value: formatCurrency(offer.referencePrice) },
            { label: "Số hành khách", value: String(count) },
          ]}
          total={flightTotal(offer, count)}
        />
        <QuoteNotice service="flight" />
        {error && <p className="sh-error" role="alert">{error}</p>}
        {!hasPhone && <MissingPhoneHint />}
        <button className="btn btn-primary" type="submit" disabled={busy || !hasPhone}>
          {busy ? "Đang gửi yêu cầu…" : "Gửi yêu cầu đặt vé"}
        </button>
      </aside>
    </form>
  );
}
