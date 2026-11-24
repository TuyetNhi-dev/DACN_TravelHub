"use client";

import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { validateFlightSearch } from "@/lib/flight-search";
import type { FlightSearch } from "@/types/flight";
import { FlightResults } from "./FlightResults";
import { FlightSearchForm } from "./FlightSearchForm";
import { FlightTabs } from "./FlightTabs";

export function FlightPage({ search }: { search: FlightSearch }) {
  const hasSearch = Boolean(search.date) && validateFlightSearch(search) === null;
  return (
    <main id="main-content" className="sf">
      <section className="sf-hero"><div className="container">
        <FlightTabs current="search" />
        <span className="kicker">SÀIHÀNH · VÉ MÁY BAY NỘI ĐỊA</span>
        <h1>Chạm mây trời,<br /><em>mở lối hành trình.</em></h1>
        <p>So sánh giá vé hợp đồng với các đối tác và gửi yêu cầu đặt chỗ trong vài bước.</p>
      </div></section>
      <div className="container sf-body">
        <FlightSearchForm initial={search} />
        <QuoteNotice service="flight" />
        {hasSearch ? <FlightResults search={search} /> : (
          <section className="sf-intro">
            <span aria-hidden="true">✈</span>
            <div>
              <h2>Hành trình bắt đầu từ một lựa chọn.</h2>
              <p>Chọn điểm đi, điểm đến và ngày bay để xem các báo giá đang mở bán.</p>
            </div>
            <div>
              <b>01 · Tìm chuyến</b><p>Chọn hành trình và ngày bay.</p>
              <b>02 · So sánh &amp; chọn</b><p>Xem giờ bay, hãng và giá hợp đồng.</p>
              <b>03 · Gửi yêu cầu</b><p>Nhập hành khách; SàiHành xác nhận với đối tác.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
