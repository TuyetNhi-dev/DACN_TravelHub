import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getDestinationImages } from "@/lib/media";

const CTA_DESTINATION = "Phú Quốc";
// The sunset photo of the Phú Quốc set reads best behind white text.
const CTA_PHOTO_INDEX = 3;

export function CtaBand() {
  const image = getDestinationImages(CTA_DESTINATION)[CTA_PHOTO_INDEX];
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <Image src={image.src} alt="" fill sizes="(max-width: 1240px) 100vw, 1200px" />
      <div className="cta-band-body">
        <span className="ui-eyebrow">Lên kế hoạch chuyến đi</span>
        <h2 id="cta-title">Sẵn sàng cho chuyến đi tiếp theo?</h2>
        <p>Chọn lịch khởi hành, giữ chỗ tour ngay và theo dõi đơn trong tài khoản của bạn.</p>
        <div className="cta-band-actions">
          <ButtonLink href="/tours" size="lg">Xem tất cả tour <Icon name="arrow" /></ButtonLink>
          <ButtonLink href="/flights" size="lg" variant="glass">
            <Icon name="plane" size={18} /> Tìm vé máy bay
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
