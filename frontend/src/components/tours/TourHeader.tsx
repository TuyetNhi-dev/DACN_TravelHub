import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import type { TourImage, TourSummary } from "@/types/tour";

/** Breadcrumb, title, "Giá từ" and the photo gallery at the top of the tour detail page. */
export function TourHeader({ tour, images }: { tour: TourSummary; images: TourImage[] }) {
  const gallery = getTourImages(tour, images);
  return (
    <>
      <div className="container detail-breadcrumb">
        <Breadcrumb items={[{ label: "Tour du lịch", href: "/tours" }, { label: tour.code }]} />
      </div>
      <div className="container detail-title">
        <div>
          <span className="kicker">MÃ TOUR {tour.code}</span>
          <h1>{tour.title}</h1>
          <p><Icon name="map" size={17} />{tour.destination}</p>
        </div>
        <div className="detail-price">
          <small>Giá từ</small><strong>{formatCurrency(tour.basePrice)}</strong><span>/ người lớn</span>
        </div>
      </div>
      <figure className="container detail-illustration">
        <Gallery images={gallery} title={tour.title} />
        {/* Only library illustrations need this disclaimer; the tour's own photos do not. */}
        {gallery.some(image => image.illustrative) && (
          <figcaption>Ảnh minh họa cho các điểm đến trong hành trình, không phải ảnh riêng của tour.</figcaption>
        )}
      </figure>
    </>
  );
}
