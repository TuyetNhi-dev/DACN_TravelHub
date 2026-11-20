"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { formatCurrency } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import { tourDuration } from "@/lib/tour-display";
import { getTour } from "@/services/tours";
import type { TourDetail as Detail } from "@/types/tour";
import { DepartureTable } from "./DepartureTable";
import { TourBookingPanel } from "./TourBookingPanel";
import { TourDepartureCalendar } from "./TourDepartureCalendar";

export function TourDetail({ id }: { id: string }) {
  const { state, retry } = useResource(`tour:${id}`, signal => getTour(id, signal));
  return (
    <main id="main-content" className="page-main detail-page">
      {state.status === "loading" && <div className="container"><LoadingState label="Đang tải thông tin tour…" /></div>}
      {state.status === "error" && (
        <div className="container">
          <ErrorState error={state.error} onRetry={retry} backHref="/tours" backLabel="Về danh sách tour" />
        </div>
      )}
      {state.status === "ready" && <TourDetailContent detail={state.data} />}
    </main>
  );
}

function TourDetailContent({ detail: { tour, itinerary, departures } }: { detail: Detail }) {
  // Shared by the departure calendar and the booking panel's dropdown so both always agree.
  const [departureId, setDepartureId] = useState<string | null>(
    () => departures.find(departure => departure.isBookable)?.id ?? null);
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
        <Gallery images={getTourImages(tour)} title={tour.title} />
        <figcaption>Ảnh minh họa cho các điểm đến trong hành trình, không phải ảnh riêng của tour.</figcaption>
      </figure>
      <div className="container detail-layout">
        <article className="detail-content">
          <div className="overview-strip">
            <span><Icon name="clock" /><small>Thời lượng</small><b>{tourDuration(tour)}</b></span>
            <span><Icon name="map" /><small>Khởi hành từ</small><b>{tour.departureFrom ?? "Đang cập nhật"}</b></span>
            <span><Icon name="bus" /><small>Phương tiện</small><b>{tour.transport ?? "Đang cập nhật"}</b></span>
          </div>
          {tour.description && <section><h2>Điểm nổi bật</h2><p>{tour.description}</p></section>}
          <section>
            <h2>Lịch trình</h2>
            {itinerary.length ? (
              <ol className="sh-timeline">
                {itinerary.map(day => (
                  <li key={day.dayNumber}>
                    <b>Ngày {day.dayNumber}</b>
                    <div><h3>{day.title}</h3>{day.description && <p>{day.description}</p>}</div>
                  </li>
                ))}
              </ol>
            ) : <p>Lịch trình chi tiết đang được cập nhật.</p>}
          </section>
          <section>
            <h2>Lịch khởi hành</h2>
            {departures.length > 0 && (
              <TourDepartureCalendar departures={departures} selectedId={departureId} onSelect={setDepartureId} />
            )}
            <DepartureTable departures={departures} />
          </section>
          <section>
            <h2>Lưu ý khi đặt tour</h2>
            <ul>
              <li>Chỗ được giữ ngay khi đặt thành công; nhân viên liên hệ xác nhận trong giờ làm việc.</li>
              <li>Bạn có thể tự hủy đơn khi đơn chưa được xác nhận và trước ngày khởi hành.</li>
              <li>Giá trẻ em áp dụng theo từng lịch; nếu lịch chưa có giá trẻ em, áp dụng giá người lớn.</li>
            </ul>
          </section>
        </article>
        <aside className="detail-booking" aria-label="Đặt tour">
          <span className="kicker">ĐẶT TOUR</span>
          <h2>Chọn lịch &amp; số khách</h2>
          <TourBookingPanel departures={departures} departureId={departureId} onDepartureChange={setDepartureId} />
        </aside>
      </div>
    </>
  );
}
