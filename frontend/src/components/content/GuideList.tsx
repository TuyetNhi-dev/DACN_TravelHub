import { PROJECT_NOTICE } from "@/components/content/ContentPage";
import { TRAVEL_GUIDES } from "@/data/travel-guides";
import { GuideCard } from "./GuideCard";

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
          {TRAVEL_GUIDES.map(guide => <GuideCard key={guide.slug} guide={guide} />)}
        </ul>
      </div>
    </main>
  );
}
