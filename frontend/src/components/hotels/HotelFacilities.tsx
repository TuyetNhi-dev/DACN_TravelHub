"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { groupAmenities, type AmenityCategory } from "@/lib/hotel-amenities";
import type { HotelAmenity } from "@/types/hotel";

/** Presentation only: which icon heads each group. */
export const CATEGORY_ICONS: Record<AmenityCategory, IconName> = {
  internet: "wifi", room: "bed", bathroom: "bath", food: "utensils", service: "bell", wellness: "waves",
  family: "users", transport: "car", safety: "shield", accessibility: "accessibility", business: "briefcase",
  other: "check",
};

const COLLAPSED_GROUPS = 4;

/** Every facility, grouped like Agoda/Traveloka; long lists start collapsed to the first groups. */
export function HotelFacilities({ amenities }: { amenities: HotelAmenity[] }) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupAmenities(amenities);
  if (groups.length === 0) return null;
  const visible = expanded ? groups : groups.slice(0, COLLAPSED_GROUPS);
  const paidCount = amenities.filter(item => item.isPaid).length;

  return (
    <section id="hotel-facilities" className="sh-hotel-panel hotel-facilities" aria-labelledby="facilities-title">
      <div className="hotel-section-head">
        <h2 id="facilities-title">Tiện nghi & dịch vụ</h2>
        <span>{amenities.length} tiện nghi{paidCount > 0 && ` · ${paidCount} có tính phí`}</span>
      </div>
      <div className="hotel-facility-groups">
        {visible.map(group => (
          <div key={group.category} className="hotel-facility-group">
            <h3><Icon name={CATEGORY_ICONS[group.category]} size={18} />{group.label}</h3>
            <ul>
              {group.items.map(item => (
                <li key={item.code}>
                  <Icon name="check" size={15} />
                  <span>{item.name}</span>
                  {item.isPaid && <small className="hotel-paid">Có phí</small>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {groups.length > COLLAPSED_GROUPS && (
        <button type="button" className="hotel-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Thu gọn" : `Xem tất cả ${amenities.length} tiện nghi`}
          <span className={expanded ? "hotel-more-up" : undefined}><Icon name="chevron" size={16} /></span>
        </button>
      )}
    </section>
  );
}
