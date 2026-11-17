import type { ReactNode } from "react";
import { cabinLabel } from "@/lib/flight-search";
import { formatCurrency, formatDate, formatDuration, formatTime, vietnamDay } from "@/lib/format";
import type { FlightOffer } from "@/types/flight";

interface FlightCardProps {
  offer: FlightOffer;
  passengers: number;
  action?: ReactNode;
  showTerms?: boolean;
}

export function FlightCard({ offer, passengers, action, showTerms = false }: FlightCardProps) {
  return (
    <article className="sf-panel sf-card">
      <div className="sf-airline">
        <span className="sf-airline-mark" aria-hidden="true">✈</span>
        <div>
          <b>{offer.airline}</b>
          <small>{offer.flightNumber} · {cabinLabel(offer.cabinClass)}</small>
        </div>
      </div>
      <div className="sf-timeline">
        <div><strong>{formatTime(offer.departAt)}</strong><span>{offer.originCode} · {offer.originCity}</span></div>
        <div className="sf-duration">
          <small>{formatDuration(offer.durationMinutes)}</small>
          <span aria-hidden="true">──── ✈ ────</span>
          <small>{formatDate(vietnamDay(offer.departAt))} · giờ Việt Nam</small>
        </div>
        <div>
          <strong>{formatTime(offer.arriveAt)}</strong>
          <span>{offer.destinationCode} · {offer.destinationCity}</span>
        </div>
      </div>
      <div className="sf-price">
        <strong>{formatCurrency(offer.referencePrice)}</strong>
        <small>/ khách · giá tham khảo</small>
        {passengers > 1 && <small>{formatCurrency(offer.referencePrice * passengers)} cho {passengers} khách</small>}
      </div>
      {showTerms && (
        <div className="sf-details">
          <p>Hành lý: {offer.baggageTerms ?? "Theo điều kiện của hãng."}</p>
          <p>Đổi/hủy: {offer.changeCancelTerms ?? "Theo điều kiện của hãng."}</p>
        </div>
      )}
      {action && <div className="sf-card-actions">{action}</div>}
    </article>
  );
}
