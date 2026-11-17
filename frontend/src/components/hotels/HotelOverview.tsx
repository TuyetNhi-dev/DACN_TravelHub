import { Icon } from "@/components/ui/Icon";
import { amenityHighlights } from "@/lib/hotel-amenities";
import type { HotelAmenity, HotelSummary, HouseRules } from "@/types/hotel";
import { CATEGORY_ICONS } from "./HotelFacilities";

interface HotelOverviewProps {
  hotel: HotelSummary;
  amenities: HotelAmenity[];
  houseRules: HouseRules;
}

const DESCRIPTION_AMENITIES = ". Tiện nghi:";

/** Description, the handful of facilities guests look for first, and the check-in window. */
export function HotelOverview({ hotel, amenities, houseRules }: HotelOverviewProps) {
  const summary = hotel.description?.split(DESCRIPTION_AMENITIES)[0];
  const highlights = amenityHighlights(amenities);
  return (
    <section id="hotel-overview" className="sh-hotel-panel" aria-labelledby="overview-title">
      <h2 id="overview-title">Về nơi lưu trú</h2>
      <p>{summary || "Đối tác chưa cung cấp mô tả chi tiết."}</p>
      {highlights.length > 0 && (
        <>
          <h3 className="hotel-subtitle">Điểm nổi bật</h3>
          <ul className="hotel-highlights">
            {highlights.map(item => (
              <li key={item.code}>
                <span aria-hidden="true"><Icon name={CATEGORY_ICONS[categoryOf(item)]} size={20} /></span>
                {item.name}
              </li>
            ))}
          </ul>
        </>
      )}
      {(houseRules.checkInFrom || houseRules.checkOutUntil) && (
        <dl className="hotel-times">
          {houseRules.checkInFrom && <div><dt>Nhận phòng</dt><dd>Từ {houseRules.checkInFrom}</dd></div>}
          {houseRules.checkOutUntil && <div><dt>Trả phòng</dt><dd>Trước {houseRules.checkOutUntil}</dd></div>}
        </dl>
      )}
    </section>
  );
}

function categoryOf(item: HotelAmenity): keyof typeof CATEGORY_ICONS {
  return item.category in CATEGORY_ICONS ? (item.category as keyof typeof CATEGORY_ICONS) : "other";
}
