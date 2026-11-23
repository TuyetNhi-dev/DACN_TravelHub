import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, MediaFrame } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatDate } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import { departsInLabel, departureHref, isFewSeats, tourDuration } from "@/lib/tour-display";
import type { UpcomingDeparture } from "@/types/tour";
import { TOUR_CARD_SIZES } from "./TourCard";

/** One departure leaving soon; the link opens the tour with this departure already selected. */
export function DepartureCard({ departure }: { departure: UpcomingDeparture }) {
  const image = getTourImages({
    id: departure.tourId, destination: departure.destination, title: departure.tourTitle,
  })[0];
  const few = isFewSeats(departure.availableSeats);
  return (
    <Card className="tour-tile">
      <MediaFrame image={image} sizes={TOUR_CARD_SIZES}>
        <Badge tone="image"><Icon name="clock" size={13} />{departsInLabel(departure.daysUntilDeparture)}</Badge>
      </MediaFrame>
      <div className="tour-tile-body">
        <span className="tour-tile-place"><Icon name="map" size={15} />{departure.destination}</span>
        <h3>
          <Link className="ui-stretched" href={departureHref(departure.tourId, departure.departureId)}>
            {departure.tourTitle}
          </Link>
        </h3>
        <ul className="tour-tile-facts">
          <li><Icon name="ticket" size={15} />{departure.tourCode}</li>
          <li>
            <Icon name="calendar" size={15} />
            {formatDate(departure.departureDate)} · từ {departure.departureFrom}
          </li>
          <li><Icon name="clock" size={15} />{tourDuration(departure)}</li>
          <li className={few ? "soon-seats is-few" : "soon-seats"}>
            <Icon name="users" size={15} />Còn {departure.availableSeats} chỗ
          </li>
        </ul>
        <div className="tour-tile-foot">
          <PriceTag prefix="Giá người lớn" amount={departure.adultPrice} />
          <span className="tour-tile-cta" aria-hidden="true">Đặt ngay</span>
        </div>
      </div>
    </Card>
  );
}
