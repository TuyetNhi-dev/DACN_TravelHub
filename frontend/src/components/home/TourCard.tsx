import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, MediaFrame } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatDate } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import { tourDuration, tourHref } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";

const CARD_SIZES = "(max-width: 640px) 85vw, (max-width: 1080px) 45vw, 380px";

/** The whole card is one link (stretched title link) so it is a single tab stop. */
export function TourCard({ tour }: { tour: TourSummary }) {
  const nextDate = tour.upcomingDepartureDates[0];
  return (
    <Card className="tour-tile">
      <MediaFrame image={getTourImages(tour)[0]} sizes={CARD_SIZES}>
        <Badge tone="image">{tour.code}</Badge>
        <Badge tone="image"><Icon name="clock" size={13} />{tourDuration(tour)}</Badge>
      </MediaFrame>
      <div className="tour-tile-body">
        <span className="tour-tile-place"><Icon name="map" size={15} />{tour.destination}</span>
        <h3><Link className="ui-stretched" href={tourHref(tour.id)}>{tour.title}</Link></h3>
        <ul className="tour-tile-facts">
          <li><Icon name="bus" size={15} />{tour.transport ?? "Phương tiện đang cập nhật"}</li>
          <li>
            <Icon name="calendar" size={15} />
            {nextDate ? `Khởi hành ${formatDate(nextDate)}` : "Chưa có lịch mở bán"}
          </li>
        </ul>
        <div className="tour-tile-foot">
          <PriceTag prefix="Giá từ" amount={tour.basePrice} unit="/ khách" />
          <span className="tour-tile-go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
        </div>
      </div>
    </Card>
  );
}
