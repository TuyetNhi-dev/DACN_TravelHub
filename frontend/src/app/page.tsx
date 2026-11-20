import { CtaBand } from "@/components/home/CtaBand";
import { DestinationMosaic } from "@/components/home/DestinationMosaic";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import { FlightFares } from "@/components/home/FlightFares";
import { HeroBanner } from "@/components/home/HeroBanner";
import { HomeCollections } from "@/components/home/HomeCollections";
import { HomePromises } from "@/components/home/HomePromises";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeToursProvider } from "@/components/home/HomeToursProvider";
import { HomeTripPlanner } from "@/components/home/HomeTripPlanner";
import { HotelHighlights } from "@/components/home/HotelHighlights";
import { TourNeeds } from "@/components/home/TourNeeds";
import { QUOTE_LABEL } from "@/components/ui/PriceTag";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
        <section className="home-section" aria-labelledby="destinations-title">
          <Reveal className="container">
            <SectionHeader id="destinations-title" eyebrow="Đi đâu tiếp theo?" title="Điểm đến được yêu thích"
              description="Từ vịnh biển di sản tới phố cổ, cao nguyên và đảo ngọc."
              link={{ href: "/tours", label: "Tất cả tour" }} />
            <DestinationMosaic />
          </Reveal>
        </section>

        <section className="home-section home-section--tint" aria-labelledby="featured-title">
          <Reveal className="container">
            <SectionHeader id="featured-title" eyebrow="Gợi ý hành trình" title="Tour nổi bật đang mở bán"
              description="Lịch khởi hành và số chỗ lấy trực tiếp từ hệ thống SàiHành."
              link={{ href: "/tours", label: "Xem tất cả tour" }} />
            <FeaturedTours />
          </Reveal>
        </section>

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

      <section className="home-section" aria-labelledby="fares-title">
        <Reveal className="container">
          <SectionHeader id="fares-title" eyebrow="Vé máy bay" title="Giá vé tham khảo"
            description={<>Giá rẻ nhất mỗi chặng trong danh mục đối tác. <strong>{QUOTE_LABEL}.</strong></>}
            link={{ href: "/flights", label: "Tìm chuyến bay" }} />
          <FlightFares />
        </Reveal>
      </section>

      <section className="home-section home-section--tint" aria-labelledby="promise-title">
        <Reveal className="container">
          <SectionHeader id="promise-title" eyebrow="Vì sao chọn SàiHành" title="Đặt chỗ rõ ràng, không hứa suông"
            description="Những điều hệ thống đặt chỗ của SàiHành thực sự đảm bảo." />
          <HomePromises />
        </Reveal>
      </section>

      <div className="container home-cta"><CtaBand /></div>
    </main>
  );
}
