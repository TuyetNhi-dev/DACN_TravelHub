"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LoginPrompt } from "@/components/bookings/LoginPrompt";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { airportCode, flightSearchParams, returnLegSearch } from "@/lib/flight-search";
import { searchFlights } from "@/services/flights";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlightBookingForm } from "./FlightBookingForm";
import { RoundTripBooking } from "./RoundTripBooking";

interface FlightBookingPageProps {
  search: FlightSearch;
  offerId: string;
  /** Present for a round trip: the return quote, booked as a second order. */
  returnOfferId?: string;
}

interface ChosenOffers {
  outbound: FlightOffer;
  inbound: FlightOffer | null;
}

/** Re-runs the search to confirm the chosen quote(s) are still sellable before showing the form. */
async function loadOffers(search: FlightSearch, offerId: string, returnOfferId: string | undefined,
  signal: AbortSignal): Promise<ChosenOffers | null> {
  const find = async (leg: FlightSearch, id: string) => {
    const query = { from: airportCode(leg.from), to: airportCode(leg.to), date: leg.date, cabin: leg.cabin };
    return (await searchFlights(query, signal)).find(offer => offer.offerId === id) ?? null;
  };
  const [outbound, inbound] = await Promise.all([
    find(search, offerId), returnOfferId ? find(returnLegSearch(search), returnOfferId) : Promise.resolve(null),
  ]);
  if (!outbound || (returnOfferId && !inbound)) return null;
  return { outbound, inbound };
}

export function FlightBookingPage({ search, offerId, returnOfferId }: FlightBookingPageProps) {
  const { state, retry } = useResource(`flight-offer:${offerId}:${returnOfferId ?? ""}`,
    signal => loadOffers(search, offerId, returnOfferId, signal));
  const { session, loading } = useAuth();
  const resultsHref = "/flights?" + flightSearchParams(search);
  return (
    <main id="main-content" className="sf">
      <div className="container sf-body sh-page">
        <Breadcrumb items={[
          { label: "Vé máy bay", href: "/flights" }, { label: "Kết quả", href: resultsHref },
          { label: returnOfferId ? "Gửi yêu cầu đặt vé khứ hồi" : "Gửi yêu cầu đặt vé" },
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
              : <BookingStep offers={state.data} passengers={search.passengers} />
        )}
      </div>
    </main>
  );
}

function BookingStep({ offers, passengers }: { offers: ChosenOffers; passengers: number }) {
  if (offers.inbound) {
    return <RoundTripBooking outbound={offers.outbound} inbound={offers.inbound} passengers={passengers} />;
  }
  return <FlightBookingForm offer={offers.outbound} passengers={passengers} />;
}
