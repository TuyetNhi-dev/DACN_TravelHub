import Image from "next/image";
import Link from "next/link";
import { PROJECT_NOTICE } from "@/components/content/ContentPage";
import { TRAVEL_GUIDES } from "@/data/travel-guides";
import { getDestinationImages } from "@/lib/media";

const CARD_SIZES = "(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 360px";

export function GuideList() {
  return (
    <main id="main-content" className="content-page">
      <div className="container guide-list-page">
        <header className="content-head">
          <h1>Cẩm nang du lịch</h1>
          <p className="content-intro">Kinh nghiệm chung để lên kế hoạch chuyến đi trong nước. Nội dung mang tính tham
            khảo; thời tiết và mùa lễ hội thay đổi theo từng năm.</p>
          <p className="content-notice" role="note">{PROJECT_NOTICE}</p>
        </header>
        <ul className="guide-grid">
          {TRAVEL_GUIDES.map(guide => {
            const image = getDestinationImages(guide.coverPlace)[0];
            return (
              <li key={guide.slug} className="guide-card">
                <div className="guide-card-media">
                  {image && <Image src={image.src} alt="" fill sizes={CARD_SIZES} />}
                </div>
                <div className="guide-card-body">
                  <span className="guide-card-tags">{guide.tags.join(" · ")}</span>
                  <h2><Link href={`/cam-nang/${guide.slug}`}>{guide.title}</Link></h2>
                  <p>{guide.summary}</p>
                  <span className="guide-card-updated">Cập nhật: {guide.updated}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
