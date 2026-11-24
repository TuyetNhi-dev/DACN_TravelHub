import { CtaBand } from "@/components/home/CtaBand";
import { DepartingSoon } from "@/components/home/DepartingSoon";
import { DestinationAccordion } from "@/components/home/DestinationAccordion";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import { HeroBanner } from "@/components/home/HeroBanner";
import { HomeCollections } from "@/components/home/HomeCollections";
import { HomeFlightDeals } from "@/components/home/HomeFlightDeals";
import { HomeHolidayBreaks } from "@/components/home/HomeHolidayBreaks";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeStorySections } from "@/components/home/HomeStorySections";
import { HomeToursProvider } from "@/components/home/HomeToursProvider";
import { HomeTripPlanner } from "@/components/home/HomeTripPlanner";
import { HotelHighlights } from "@/components/home/HotelHighlights";
import { TourNeeds } from "@/components/home/TourNeeds";
import { QUOTE_LABEL } from "@/components/ui/PriceTag";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SOON_DAYS } from "@/services/tours";
import "@/styles/flight-deals.css";
import "@/styles/flights.css";
import "@/styles/holiday-breaks.css";

export default function Home() {
  return (
    <main id="main-content" className="home">
      <section className="hero hero--immersive" aria-label="Điểm đến nổi bật">
        <HeroBanner />
        <div className="container search-wrap" id="home-search"><HomeSearch /></div>
      </section>
      <HomeTripPlanner />
      <HomeCollections />

      <HomeToursProvider>
        <section className="home-section home-section--tint" aria-labelledby="featured-title">
          <Reveal className="container">
            <SectionHeader id="featured-title" eyebrow="Tour trọn gói" title="Tour trọn gói SàiHành"
              description="Chọn vùng điểm đến. Lịch khởi hành và giá lấy trực tiếp từ hệ thống SàiHành."
              link={{ href: "/tours", label: "Xem tất cả tour" }} />
            <FeaturedTours />
          </Reveal>
        </section>

        <section className="home-section" aria-labelledby="destinations-title">
          <Reveal className="container">
            <SectionHeader id="destinations-title" eyebrow="Đi đâu tiếp theo?" title="Điểm đến được yêu thích"
              description="Từ vịnh biển di sản tới phố cổ, cao nguyên và đảo ngọc."
              link={{ href: "/tours", label: "Tất cả tour" }} />
            <DestinationAccordion />
          </Reveal>
        </section>

        <section className="home-section" aria-labelledby="soon-title">
          <Reveal className="container">
            <div className="soon-band">
              <SectionHeader id="soon-title" eyebrow="Sắp khởi hành" title={`Khởi hành trong ${SOON_DAYS} ngày tới`}
                description="Số chỗ còn lại tính tại lúc tải trang; chỗ chỉ được giữ khi bạn đặt."
                link={{ href: "/tours", label: "Xem tất cả tour" }} />
              <DepartingSoon />
            </div>
          </Reveal>
        </section>

        <HomeHolidayBreaks />

        <section className="home-section" aria-labelledby="needs-title">
          <Reveal className="container">
            <SectionHeader id="needs-title" eyebrow="Tour theo nhu cầu" title="Chọn kiểu chuyến đi hợp với bạn"
              description="Nhóm theo thời lượng và phương tiện của từng tour." />
            <TourNeeds />
          </Reveal>
        </section>
      </HomeToursProvider>

      <section className="home-section home-section--tint" aria-labelledby="hotels-title">
        <Reveal className="container">
          <SectionHeader id="hotels-title" eyebrow="Lưu trú" title="Khách sạn nổi bật"
            description={<>Giá phòng do đối tác cung cấp. <strong>{QUOTE_LABEL}.</strong></>}
            link={{ href: "/hotels", label: "Xem tất cả khách sạn" }} />
          <HotelHighlights />
        </Reveal>
      </section>

      <section className="home-section home-section--sun" aria-labelledby="deals-title">
        <Reveal className="container">
          <SectionHeader id="deals-title" eyebrow="Săn deal vé máy bay" title="Vé deal, xác nhận ngay"
            description="Quỹ ghế SàiHành đã ký với hãng: giữ ghế khi đặt, thanh toán trong hạn là có vé."
            link={{ href: "/flights/deals", label: "Xem tất cả vé deal" }} />
          <HomeFlightDeals />
        </Reveal>
      </section>

      <HomeStorySections />

      <div className="container home-cta"><CtaBand /></div>
    </main>
  );
}
