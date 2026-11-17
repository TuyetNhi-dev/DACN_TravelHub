import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import { amenitiesOf } from "@/lib/hotel-filters";
import { stayParams } from "@/lib/hotel-stay";
import { getHotelImages } from "@/lib/media";
import type { HotelSummary, Stay } from "@/types/hotel";

const VISIBLE_AMENITIES = 4;
const CARD_SIZES = "(max-width: 760px) 100vw, 320px";

export function HotelCard({ hotel, stay }: { hotel: HotelSummary; stay: Stay }) {
  const image = getHotelImages(hotel)[0];
  const href = `/hotels/${encodeURIComponent(hotel.id)}?${stayParams(stay)}`;
  return (
    <article className="sh-hotel-card">
      <Link href={href} className="sh-hotel-card-image" aria-label={`Xem ${hotel.name}`}>
        <Image src={image.src} alt={image.alt} fill sizes={CARD_SIZES} />
        {image.illustrative && <span>Ảnh minh họa</span>}
      </Link>
      <div className="sh-hotel-card-content">
        {hotel.starRating !== null && <span className="sh-hotel-badge">{hotel.starRating} sao</span>}
        <h3><Link href={href}>{hotel.name}</Link></h3>
        <p className="sh-hotel-location"><Icon name="map" size={16} />{hotel.city}</p>
        {hotel.address && <p className="sh-hotel-caption">{hotel.address}</p>}
        <div className="sh-hotel-chips">
          {amenitiesOf(hotel.description).slice(0, VISIBLE_AMENITIES).map(item => <span key={item}>{item}</span>)}
        </div>
        <div className="sh-hotel-card-bottom">
          <div>
            <small>Giá tham khảo từ / đêm</small>
            <strong>{formatCurrency(hotel.referencePricePerNight)}</strong>
          </div>
          <Link className="btn btn-outline" href={href}>Xem phòng <Icon name="arrow" size={16} /></Link>
        </div>
      </div>
    </article>
  );
}
