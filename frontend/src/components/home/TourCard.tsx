import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, MediaFrame } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatDate } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import { tourDuration, tourHref } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";
import { DepartureChips } from "./DepartureChips";

/** Carousel slides are 85% of a phone screen; the /tours grid fills it (see LISTING_CARD_SIZES). */
export const TOUR_CARD_SIZES = "(max-width: 640px) 85vw, (max-width: 1080px) 45vw, 380px";
export const LISTING_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1080px) 45vw, 300px";

interface TourCardProps {
  tour: TourSummary;
  /** Package layout: departure city, date chips and a "Xem chi tiết" pill instead of the next date. */
  showDepartureDates?: boolean;
  sizes?: string;
}

/** The whole card is one link (stretched title link) so it is a single tab stop. */
export function TourCard({ tour, showDepartureDates = false, sizes = TOUR_CARD_SIZES }: TourCardProps) {
  return (
    <Card className="tour-tile">
      <MediaFrame image={getTourImages(tour)[0]} sizes={sizes}>
        <Badge tone="image">{tour.code}</Badge>
        <Badge tone="image"><Icon name="clock" size={13} />{tourDuration(tour)}</Badge>
      </MediaFrame>
      <div className="tour-tile-body">
        <span className="tour-tile-place"><Icon name="map" size={15} />{tour.destination}</span>
        <h3><Link className="ui-stretched" href={tourHref(tour.id)}>{tour.title}</Link></h3>
        {showDepartureDates ? <PackageFacts tour={tour} /> : <TourFacts tour={tour} />}
        <div className="tour-tile-foot">
          <PriceTag prefix="Giá từ" amount={tour.basePrice} unit="/ khách" />
          {showDepartureDates
            ? <span className="tour-tile-cta" aria-hidden="true">Xem chi tiết</span>
            : <span className="tour-tile-go" aria-hidden="true"><Icon name="arrow" size={18} /></span>}
        </div>
      </div>
    </Card>
  );
}

function TourFacts({ tour }: { tour: TourSummary }) {
  const nextDate = tour.upcomingDepartureDates[0];
  return (
    <ul className="tour-tile-facts">
      <li><Icon name="bus" size={15} />{tour.transport ?? "Phương tiện đang cập nhật"}</li>
      <li>
        <Icon name="calendar" size={15} />
        {nextDate ? `Khởi hành ${formatDate(nextDate)}` : "Chưa có lịch mở bán"}
      </li>
    </ul>
  );
}

function PackageFacts({ tour }: { tour: TourSummary }) {
  return (
    <>
      <ul className="tour-tile-facts">
        <li><Icon name="calendar" size={15} />Khởi hành từ {tour.departureFrom ?? "đang cập nhật"}</li>
        <li><Icon name="bus" size={15} />{tour.transport ?? "Phương tiện đang cập nhật"}</li>
      </ul>
      <DepartureChips dates={tour.upcomingDepartureDates} />
    </>
  );
}
