import Link from "next/link";
import { weekdayName } from "@/lib/flight-calendar";
import { dealSearchHref } from "@/lib/flight-deals";
import { formatCurrency, formatDate, formatDateTime, formatTime, vietnamDay } from "@/lib/format";
import type { FlightDeal } from "@/types/flight";
import { ConfirmationBadges } from "./DealBadges";

/** A route's headline deal; featured ones are staff picks, so neither is called "the cheapest". */
export function FlightDealCard({ deal }: { deal: FlightDeal }) {
  const day = vietnamDay(deal.departAt);
  return (
    <article className={deal.isFeatured ? "fd-card is-featured" : "fd-card"}>
      <div className="fd-pills">
        <span className="fd-badge">{deal.isFeatured ? "Ưu đãi nổi bật" : "Giá deal"}</span>
        <ConfirmationBadges remainingSeats={deal.remainingSeats} />
      </div>
      <h2>
        {deal.originCity} <span aria-hidden="true">→</span><span className="sr-only">đến</span> {deal.destinationCity}
      </h2>
      <p className="fd-route">{deal.originCode} – {deal.destinationCode} · {deal.airline} {deal.flightNumber}</p>
      <p className="fd-date">{weekdayName(day)}, {formatDate(day)} · {formatTime(deal.departAt)}</p>
      <p className="fd-price">
        <small>từ</small> <strong>{formatCurrency(deal.referencePrice)}</strong> <small>/ khách</small>
      </p>
      <p className="fd-updated">Báo giá cập nhật {formatDateTime(deal.quoteUpdatedAt)}</p>
      <Link className="btn btn-primary" href={dealSearchHref(deal)}
        aria-label={`Xem lịch giá ${deal.originCity} đến ${deal.destinationCity}`}>
        Xem lịch giá
      </Link>
    </article>
  );
}
