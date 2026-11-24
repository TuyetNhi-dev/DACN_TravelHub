import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatDate } from "@/lib/format";
import { tourDuration, tourHref } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";

/** Every figure here comes from the tour DTO the search returned, never from the assistant's text. */
export function AssistantTourCard({ tour, onOpen }: { tour: TourSummary; onOpen: () => void }) {
  const next = tour.upcomingDepartureDates[0];
  return (
    <li>
      <Link className="assistant-tour" href={tourHref(tour.id)} onClick={onOpen}>
        <span className="assistant-tour-place"><Icon name="map" size={13} />{tour.destination}</span>
        <span className="assistant-tour-title">{tour.title}</span>
        <span className="assistant-tour-meta">
          <Icon name="clock" size={13} />{tourDuration(tour)}
          <span aria-hidden="true">·</span>
          <Icon name="calendar" size={13} />{next ? `Khởi hành ${formatDate(next)}` : "Chưa có lịch mở bán"}
        </span>
        <PriceTag prefix="Giá từ" amount={tour.basePrice} unit="/ khách" />
      </Link>
    </li>
  );
}
