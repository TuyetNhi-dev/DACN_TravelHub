import { Icon, type IconName } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import { tourDuration } from "@/lib/tour-display";
import type { TourDeparture, TourSummary } from "@/types/tour";

interface Highlight {
  icon: IconName;
  label: string;
  value: string;
}

/** Every value comes from the tour and its departures; nothing is estimated. */
function highlightsOf(tour: TourSummary, departures: TourDeparture[]): Highlight[] {
  const open = departures.filter(departure => departure.isBookable);
  const next = open[0];
  return [
    { icon: "clock", label: "Thời lượng", value: tourDuration(tour) },
    { icon: "map", label: "Khởi hành từ", value: tour.departureFrom ?? "Đang cập nhật" },
    { icon: "bus", label: "Phương tiện", value: tour.transport ?? "Đang cập nhật" },
    { icon: "calendar", label: "Lịch gần nhất", value: next ? formatDate(next.departureDate) : "Chưa mở bán" },
    { icon: "ticket", label: "Lịch đang mở", value: open.length ? `${open.length} lịch khởi hành` : "Chưa có" },
    { icon: "shield", label: "Giữ chỗ", value: "Trừ chỗ ngay khi đặt" },
  ];
}

export function TourHighlights({ tour, departures }: { tour: TourSummary; departures: TourDeparture[] }) {
  return (
    <ul className="tour-highlights" aria-label="Thông tin nổi bật của tour">
      {highlightsOf(tour, departures).map(item => (
        <li key={item.label}>
          <span className="tour-highlights-icon" aria-hidden="true"><Icon name={item.icon} size={20} /></span>
          <small>{item.label}</small>
          <b>{item.value}</b>
        </li>
      ))}
    </ul>
  );
}
