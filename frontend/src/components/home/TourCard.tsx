/* eslint-disable @next/next/no-img-element -- Prototype illustration, explicitly labelled. */
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { tourHref } from "@/lib/tour-display";
import { photos } from "@/data/home";
import type { Tour, TourDeparture } from "@/types/tour";
import { formatCurrency } from "@/lib/format";

export interface TourCardProps {
  tour: Tour;
  departures: TourDeparture[] | null;
}

export function TourCard({ tour, departures }: TourCardProps) {
  // The API has no image column. This is a generic illustration, not a tour photo.
  const date = departures?.map(item => item.ngayKhoiHanh)
    .filter((value): value is string => value !== null).sort()[0];
  const duration = [
    tour.soNgay !== null ? `${tour.soNgay} ngày` : null,
    tour.soDem !== null ? `${tour.soDem} đêm` : null,
  ].filter(Boolean).join(" ") || "Chưa có thời lượng";
  return (
    <article className="tour-card">
      <div className="tour-image">
        <img src={photos.hero} alt="Ảnh du lịch minh họa, không phải ảnh riêng của tour" loading="lazy" />
        {tour.loaiDuLieu && <span className="tag">{tour.loaiDuLieu}</span>}
        <span className="tour-illustration-label">Ảnh minh họa</span>
        <button className="heart" aria-label="Yêu thích sắp ra mắt" disabled><Icon name="heart" size={19} /></button>
      </div>
      <div className="tour-body">
        <div className="eyebrow"><Icon name="map" size={15} />{tour.diemDen || "Chưa có điểm đến"}</div>
        <h3>{tour.tenTour || "Tour chưa có tên"}</h3>
        <div className="meta">
          <span><Icon name="clock" size={16} />{duration}</span>
          <span><Icon name="bus" size={16} />{tour.phuongTien || "Chưa có phương tiện"}</span>
        </div>
        <div className="rating"><Icon name="calendar" size={15} /><b>
          {departures === null ? "Chưa tải được lịch khởi hành" :
            date ? `Lịch đầu tiên: ${date.split("-").reverse().join("/")}` : "Chưa có lịch khởi hành"}
        </b></div>
        <div className="card-footer">
          <div><small>Giá người lớn tham khảo</small><strong>
            {formatCurrency(tour.giaNguoiLonVnd)}
          </strong></div>
          <Link className="btn btn-outline" href={tourHref(tour.tourId)}>Xem chi tiết</Link>
        </div>
      </div>
    </article>
  );
}


