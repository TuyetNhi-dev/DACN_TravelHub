import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Resource } from "@/hooks/useResource";
import { formatDate } from "@/lib/format";
import { dayLabel, toursForBreak, type BreakTourMatch, type HolidayBreak } from "@/lib/holiday-breaks";
import { tourDuration, tourHref } from "@/lib/tour-display";
import type { TourSummary } from "@/types/tour";

const MAX_TOURS = 6;
const SKELETON_ROWS = 2;
const dayMonth = (iso: string) => formatDate(iso).slice(0, 5);

/** Tours whose whole trip fits the break; `tours` is already narrowed to the chosen departure region. */
export function BreakTours({ item, tours }: { item: HolidayBreak; tours: Resource<TourSummary[]> }) {
  if (tours.status === "loading") return <TourSkeletons />;
  if (tours.status === "error") return <p className="break-status">Chưa tải được danh sách tour.</p>;
  const matches = toursForBreak(tours.data, item);
  if (matches.length === 0) {
    return (
      <div className="break-empty">
        <p>Chưa có tour mở bán vừa khoảng nghỉ này.</p>
        <Link className="btn btn-outline btn-small" href="/tours">Xem tất cả tour</Link>
      </div>
    );
  }
  const hidden = matches.length - MAX_TOURS;
  return (
    <section className="break-tours-section" aria-label={`Tour phù hợp kỳ nghỉ ${item.holidayNames.join(", ")}`}>
      <h3 className="break-tours-title">Tour vừa đợt nghỉ <span>({matches.length})</span></h3>
      <ul className="break-tours">
        {matches.slice(0, MAX_TOURS).map(match => (
          <BreakTourRow key={match.tour.id} match={match} leaveDate={item.bridge?.leaveDate ?? null} />
        ))}
      </ul>
      {hidden > 0 && <p className="break-status">và {hidden} tour khác phù hợp.</p>}
    </section>
  );
}

function TourSkeletons() {
  return (
    <div className="break-tours" role="status" aria-busy="true">
      <span className="sr-only">Đang tìm tour phù hợp…</span>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div key={index} className="break-tour-skeleton" aria-hidden="true">
          <Skeleton className="ui-skeleton--short" /><Skeleton /><Skeleton className="ui-skeleton--mid" />
        </div>
      ))}
    </div>
  );
}

function BreakTourRow({ match, leaveDate }: { match: BreakTourMatch; leaveDate: string | null }) {
  const { tour, departureDate, returnDate, needsBridge } = match;
  return (
    <li>
      <Link className="break-tour-link" href={tourHref(tour.id)}>
        <span className="break-tour-place"><Icon name="map" size={14} />{tour.destination}</span>
        <span className="break-tour-title">{tour.title}</span>
        <span className="break-tour-meta">
          <Icon name="calendar" size={14} />
          <span>
            <time dateTime={departureDate}>{dayMonth(departureDate)}</time> → {" "}
            <time dateTime={returnDate}>{dayMonth(returnDate)}</time> · {tourDuration(tour)}
          </span>
        </span>
        {needsBridge && leaveDate && (
          <span className="break-tour-tag"><Icon name="sun" size={13} />Cần nghỉ thêm {dayLabel(leaveDate)}</span>
        )}
        <span className="break-tour-foot">
          <PriceTag prefix="Giá tour từ" amount={tour.basePrice} unit="/ khách" />
          <span className="break-tour-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
        </span>
      </Link>
    </li>
  );
}
