"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { flightTotal } from "@/lib/flight-search";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { isDeal, seatShortage } from "@/lib/flight-deals";
import { formatCurrency, formatTime } from "@/lib/format";
import { createFlightBooking } from "@/services/bookings";
import type { BookingDetail, PassengerInput } from "@/types/booking";
import type { FlightOffer } from "@/types/flight";
import { DealNotice } from "./DealBadges";
import { FlightBookingForm } from "./FlightBookingForm";
import { FlightCard } from "./FlightCard";
import { SEPARATE_ORDERS_NOTE } from "./RoundTripResults";

interface RoundTripBookingProps {
  outbound: FlightOffer;
  inbound: FlightOffer;
  passengers: number;
}

interface OutboundDone {
  booking: BookingDetail;
  passengers: PassengerInput[];
}

/**
 * Step 1 sends the outbound request as its own order; step 2 offers the return leg right away with the same
 * passengers, kept in memory only. Two orders, because each leg is confirmed and paid on its own.
 */
export function RoundTripBooking({ outbound, inbound, passengers }: RoundTripBookingProps) {
  const [done, setDone] = useState<OutboundDone | null>(null);
  return (
    <>
      <ol className="sf-steps" aria-label="Các bước đặt khứ hồi">
        <li aria-current={done ? undefined : "step"}>1 · Đơn chiều đi</li>
        <li aria-current={done ? "step" : undefined}>2 · Đơn chiều về</li>
      </ol>
      <p className="fp-separate" role="note">{SEPARATE_ORDERS_NOTE}</p>
      {done
        ? <ReturnLegStep outboundBooking={done.booking} inbound={inbound} passengers={done.passengers} />
        : <FlightBookingForm offer={outbound} passengers={passengers} submitLabel="Gửi yêu cầu chiều đi"
            onCreated={(booking, list) => setDone({ booking, passengers: list })} />}
    </>
  );
}

interface ReturnLegStepProps {
  outboundBooking: BookingDetail;
  inbound: FlightOffer;
  passengers: PassengerInput[];
}

function ReturnLegStep({ outboundBooking, inbound, passengers }: ReturnLegStepProps) {
  const router = useRouter();
  const { submit, busy, error } = useBookingSubmit();
  const outboundHref = `/bookings/${encodeURIComponent(outboundBooking.id)}?created=1`;
  const shortage = seatShortage(inbound, passengers.length);
  const send = () => void submit(() => createFlightBooking({ offerId: inbound.offerId, passengers }),
    booking => router.push(`/bookings/${encodeURIComponent(booking.id)}?created=1`));

  return (
    <div className="sh-two-column">
      <div>
        <p className="sh-success" role="status">
          Đã tạo đơn chiều đi, mã <strong>{outboundBooking.code}</strong>. Đặt chiều về ngay bên dưới.
        </p>
        {outboundBooking.holdExpiresAt && (
          <p className="sh-error" role="note">
            Chiều đi là vé deal, ghế được giữ đến {formatTime(outboundBooking.holdExpiresAt)}. Nhớ thanh toán đơn
            {" "}{outboundBooking.code} trong hạn, nếu không ghế sẽ được trả lại.
          </p>
        )}
        <FlightCard offer={inbound} passengers={passengers.length} showTerms />
        <section className="sh-panel">
          <h2>Hành khách chiều về</h2>
          <ul>
            {passengers.map((passenger, index) => <li key={index + passenger.fullName}>{passenger.fullName}</li>)}
          </ul>
          <p className="sh-hotel-caption">Dùng lại danh sách hành khách của chiều đi.</p>
        </section>
      </div>
      <aside className="sh-panel sh-sticky" aria-label="Tóm tắt chiều về">
        <h2>Chiều về</h2>
        <PriceSummary total={flightTotal(inbound, passengers.length)} lines={[{
          label: isDeal(inbound) ? "Giá deal / khách" : "Giá hợp đồng / khách",
          value: formatCurrency(inbound.referencePrice),
        }]} />
        {isDeal(inbound) ? <DealNotice /> : <QuoteNotice service="flight" />}
        {shortage && <p className="sh-error" role="alert">{shortage}</p>}
        {error && <p className="sh-error" role="alert">{error}</p>}
        <button type="button" className="btn btn-primary" disabled={busy || shortage !== null} onClick={send}>
          {busy ? "Đang gửi yêu cầu…" : "Đặt chiều về ngay"}
        </button>
        <Link className="btn btn-outline" href={outboundHref}>Để sau, xem đơn chiều đi</Link>
      </aside>
    </div>
  );
}
