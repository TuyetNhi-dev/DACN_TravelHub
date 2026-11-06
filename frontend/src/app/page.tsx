/* eslint-disable @next/next/no-img-element -- Preserve original Make sample imagery. */
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { HomeSearch } from "@/components/home/HomeSearch";
import { FeaturedTours } from "@/components/home/FeaturedTours";
import { HomeCatalog } from "@/components/home/HomeCatalog";
import { photos, destinations, benefits } from "@/data/home";
export default function Home() { return <main id="main-content">        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="kicker"><span>✦</span> HÀNH TRÌNH ĐÁNG NHỚ BẮT ĐẦU TỪ ĐÂY</span>
              <h1>Khám phá Việt Nam<br />theo <em>cách của bạn</em></h1>
              <p>Từ những miền biển xanh đến núi rừng hùng vĩ, SàiHành đồng hành cùng bạn trên mọi hành trình khám phá Việt Nam.</p>
              <div className="hero-cta"><Link className="btn btn-primary btn-large" href="/#tours">Khám phá ngay <Icon name="arrow" /></Link><span><b>Lập kế hoạch dễ dàng</b><small>Tour, khách sạn và vé máy bay trong một nơi</small></span></div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrap"><img src={photos.hero} alt="Vịnh Hạ Long nhìn từ trên cao" fetchPriority="high" width={700} height={560} /></div>
              <div className="floating-card deal"><span className="deal-icon"><Icon name="ticket" /></span><span><small>Gợi ý hành trình</small><b>Lịch trình linh hoạt</b></span></div>
              <div className="floating-card review"><span className="deal-icon"><Icon name="shield" /></span><span><b>Thông tin minh bạch</b><small>Chi phí hiển thị rõ ràng</small></span></div>
            </div>
          </div>
          <div className="container search-wrap" id="home-search"><HomeSearch /></div>
        </section>

        <section className="section" id="tours">
          <div className="container">
            <div className="section-head"><div><span className="kicker">GỢI Ý HÀNH TRÌNH</span><h2>Tour nổi bật dành cho bạn</h2><p>Thông tin tour và lịch khởi hành được tải từ hệ thống SàiHành.</p></div><Link className="view-all" href="/tours">Xem tất cả tour <Icon name="arrow" /></Link></div>
            <FeaturedTours />
          </div>
        </section>

        <section className="section destinations">
          <div className="container">
            <div className="section-head compact"><div><span className="kicker">ĐI ĐÂU TIẾP THEO?</span><h2>Điểm đến được yêu thích</h2></div></div>
            <div className="destination-grid">
              {destinations.map((place) => <Link className="destination" href={`/tours?q=${encodeURIComponent(place.name === "Vịnh Hạ Long" ? "Hạ Long" : place.name)}`} key={place.name}><img src={place.image} alt={place.name} loading="lazy" width={600} height={400} /><span><b>{place.name}</b><small>{place.count}</small></span><i><Icon name="arrow" size={18} /></i></Link>)}
            </div>
          </div>
        </section>

        <section className="section featured-services" id="hotels">
          <div className="container">
            <div className="section-head"><div><span className="kicker">LƯU TRÚ THOẢI MÁI</span><h2>Khách sạn nổi bật</h2><p>Khám phá danh mục lưu trú tại các điểm đến trong nước.</p></div><a className="view-all" href="#home-search">Tìm dịch vụ <Icon name="search" /></a></div>
            <HomeCatalog kind="hotel" />
          </div>
        </section>

        <section className="section flight-section" id="flights">
          <div className="container">
            <div className="section-head"><div><span className="kicker">LỰA CHỌN CHUYẾN BAY</span><h2>Giá vé tham khảo</h2><p>Danh mục từ hệ thống; giá cần xác nhận trước khi đặt.</p></div></div>
            <HomeCatalog kind="flight" />
          </div>
        </section>

        <section className="section services" id="services">
          <div className="container">
            <div className="why" id="about">
              <div><span className="kicker">SÀIHÀNH ĐỒNG HÀNH CÙNG BẠN</span><h2>Đi để cảm nhiều hơn.</h2><p>Khám phá Việt Nam cùng SàiHành, từ Sài Gòn, Cần Thơ, Hà Nội đến Đà Nẵng. Tìm điểm đến và lựa chọn dịch vụ phù hợp cho hành trình của bạn.</p></div>
              <div className="benefits">
                {benefits.map((item) => <div className="benefit" key={item.title}><span><Icon name={item.icon} /></span><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}
              </div>
            </div>
            <div className="promo"><div><span className="kicker light">LÊN KẾ HOẠCH CHUYẾN ĐI</span><h2>Sẵn sàng cho hành trình<br />tiếp theo của bạn?</h2><p>Khám phá tour và lựa chọn lịch trình phù hợp. Chưa có chương trình ưu đãi được xác nhận.</p><Link className="btn btn-white" href="/tours">Xem tour du lịch <Icon name="arrow" /></Link></div><div className="promo-circle"><Icon name="plane" size={52} /><strong>Đi thôi!</strong><small>SÀIHÀNH</small></div></div>
          </div>
        </section>
</main>; }
