"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getTour } from "@/services/tours";
import type { CartChoice } from "@/types/cart";
import type { TourDetail as Detail } from "@/types/tour";
import { DepartureTable } from "./DepartureTable";
import { TourBookingPanel } from "./TourBookingPanel";
import { TourDepartureCalendar } from "./TourDepartureCalendar";
import { TourHeader } from "./TourHeader";
import { TourHighlights } from "./TourHighlights";
import { TourInclusions } from "./TourInclusions";
import { TourMobileBookBar } from "./TourMobileBookBar";

const BOOKING_PANEL_ID = "tour-booking";

export function TourDetail({ id, prefill = {} }: { id: string; prefill?: Partial<CartChoice> }) {
  const { state, retry } = useResource(`tour:${id}`, signal => getTour(id, signal));
  return (
    <main id="main-content" className="page-main detail-page">
      {state.status === "loading" && <div className="container"><LoadingState label="Đang tải thông tin tour…" /></div>}
      {state.status === "error" && (
        <div className="container">
          <ErrorState error={state.error} onRetry={retry} backHref="/tours" backLabel="Về danh sách tour" />
        </div>
      )}
      {state.status === "ready" && <TourDetailContent detail={state.data} prefill={prefill} />}
    </main>
  );
}

interface TourDetailContentProps {
  detail: Detail;
  prefill: Partial<CartChoice>;
}

function TourDetailContent({ detail, prefill }: TourDetailContentProps) {
  const { tour, itinerary, departures, images, inclusions } = detail;
  // Shared by the departure calendar and the booking panel's dropdown so both always agree.
  // A departure pre-filled from the cart is used only while it can still be booked.
  const [departureId, setDepartureId] = useState<string | null>(() =>
    departures.find(departure => departure.isBookable && departure.id === prefill.departureId)?.id
      ?? departures.find(departure => departure.isBookable)?.id ?? null);
  return (
    <>
      <TourHeader tour={tour} images={images} />
      <div className="container detail-layout">
        <article className="detail-content">
          <TourHighlights tour={tour} departures={departures} />
          {tour.description && <section><h2>Giới thiệu hành trình</h2><p>{tour.description}</p></section>}
          <section>
            <h2>Lịch trình</h2>
            {itinerary.length ? (
              <ol className="sh-timeline tour-timeline">
                {itinerary.map(day => (
                  <li key={day.dayNumber}>
                    <b>Ngày {day.dayNumber}</b>
                    <div><h3>{day.title}</h3>{day.description && <p>{day.description}</p>}</div>
                  </li>
                ))}
              </ol>
            ) : <p>Lịch trình chi tiết đang được cập nhật.</p>}
          </section>
          <TourInclusions inclusions={inclusions} />
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
        <aside id={BOOKING_PANEL_ID} className="detail-booking" aria-label="Đặt tour" tabIndex={-1}>
          <span className="kicker">ĐẶT TOUR</span>
          <h2>Chọn lịch &amp; số khách</h2>
          <TourBookingPanel departures={departures} departureId={departureId} onDepartureChange={setDepartureId}
            initialCounts={{ adultCount: prefill.adultCount, childCount: prefill.childCount }} />
        </aside>
      </div>
      <TourMobileBookBar price={tour.basePrice} targetId={BOOKING_PANEL_ID} />
    </>
  );
}
