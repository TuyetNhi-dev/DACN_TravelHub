import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HomeGuides } from "./HomeGuides";
import { HomePromises } from "./HomePromises";
import { HomeTestimonials } from "./HomeTestimonials";

/** Lower half of the home page: why SàiHành, travel guides and the (sample) guest reviews. */
export function HomeStorySections() {
  return (
    <>
      <section className="home-section home-section--deep" aria-labelledby="promise-title">
        <Reveal className="container">
          <SectionHeader id="promise-title" eyebrow="Vì sao chọn SàiHành" title="Đặt chỗ rõ ràng, không hứa suông"
            description="Những điều hệ thống đặt chỗ của SàiHành thực sự đảm bảo." />
          <HomePromises />
        </Reveal>
      </section>

      <section className="home-section" aria-labelledby="guides-title">
        <Reveal className="container">
          <SectionHeader id="guides-title" eyebrow="Cẩm nang" title="Kinh nghiệm cho chuyến đi"
            description="Chọn mùa, chuẩn bị hành lý và đi cùng gia đình cho trọn vẹn."
            link={{ href: "/cam-nang", label: "Đọc cẩm nang" }} />
          <HomeGuides />
        </Reveal>
      </section>

      <section className="home-section home-section--tint" aria-labelledby="reviews-title">
        <Reveal className="container">
          <SectionHeader id="reviews-title" eyebrow="Khách nói gì" title="Cảm nhận sau chuyến đi" />
          <HomeTestimonials />
        </Reveal>
      </section>
    </>
  );
}
