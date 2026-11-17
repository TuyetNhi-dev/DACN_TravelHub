"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ContactDetails, MissingPhoneHint, useHasContactPhone } from "@/components/bookings/ContactDetails";
import { LoginPrompt } from "@/components/bookings/LoginPrompt";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QuoteNotice } from "@/components/ui/QuoteNotice";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { useResource } from "@/hooks/useResource";
import { nameIssue } from "@/lib/booking-rules";
import { formatCurrency, formatDate } from "@/lib/format";
import { roomIssue, stayEstimate, stayNights, stayParams } from "@/lib/hotel-stay";
import { createHotelBooking } from "@/services/bookings";
import { getHotel } from "@/services/hotels";
import type { HotelDetail, Stay } from "@/types/hotel";
import { StayFields } from "./StayFields";

interface HotelBookingPageProps {
  hotelId: string;
  roomTypeId: string;
  initialStay: Stay;
}

export function HotelBookingPage({ hotelId, roomTypeId, initialStay }: HotelBookingPageProps) {
  const { state, retry } = useResource(`hotel:${hotelId}`, signal => getHotel(hotelId, signal));
  const { session, loading } = useAuth();
  return (
    <main id="main-content" className="sh-hotels">
      <div className="container sh-hotel-body">
        {state.status === "loading" && <LoadingState label="Đang tải thông tin phòng…" />}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} backHref="/hotels" />}
        {state.status === "ready" && (
          <>
            <Breadcrumb items={[
              { label: "Khách sạn", href: "/hotels" },
              { label: state.data.hotel.name, href: `/hotels/${encodeURIComponent(hotelId)}?${stayParams(initialStay)}` },
              { label: "Gửi yêu cầu đặt phòng" },
            ]} />
            {loading && <p role="status">Đang kiểm tra phiên đăng nhập…</p>}
            {!loading && !session && <LoginPrompt action="gửi yêu cầu đặt phòng" />}
            {!loading && session && (
              <HotelBookingForm detail={state.data} roomTypeId={roomTypeId} initialStay={initialStay}
                defaultGuestName={session.user.fullName} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

interface HotelBookingFormProps {
  detail: HotelDetail;
  roomTypeId: string;
  initialStay: Stay;
  defaultGuestName: string;
}

function HotelBookingForm({ detail, roomTypeId, initialStay, defaultGuestName }: HotelBookingFormProps) {
  const [stay, setStay] = useState(initialStay);
  const [roomId, setRoomId] = useState(roomTypeId || detail.roomTypes[0]?.id || "");
  const [guestName, setGuestName] = useState(defaultGuestName);
  const { submit, busy, error, setError } = useBookingSubmit();
  const hasPhone = useHasContactPhone();
  const room = detail.roomTypes.find(item => item.id === roomId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = room ? roomIssue(room, stay) ?? nameIssue(guestName) : "Vui lòng chọn loại phòng.";
    if (issue || !room) { setError(issue ?? ""); return; }
    void submit(() => createHotelBooking({
      roomTypeId: room.id, checkIn: stay.checkIn, checkOut: stay.checkOut,
      roomCount: stay.rooms, guestCount: stay.guests, leadGuestName: guestName.trim(),
    }));
  }

  return (
    <form className="sh-two-column" onSubmit={handleSubmit}>
      <div>
        <section className="sh-panel">
          <h2>Phòng và lịch lưu trú</h2>
          <label className="sh-field">
            Loại phòng
            <select value={roomId} onChange={event => setRoomId(event.target.value)}>
              {detail.roomTypes.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} · tối đa {item.maxGuests} khách · {formatCurrency(item.referencePricePerNight)}/đêm
                </option>
              ))}
            </select>
          </label>
          <StayFields stay={stay} onChange={setStay} />
        </section>
        <section className="sh-panel">
          <h2>Khách nhận phòng</h2>
          <label className="sh-field">
            Họ tên người nhận phòng
            <input value={guestName} onChange={event => setGuestName(event.target.value)} required minLength={2}
              maxLength={160} autoComplete="name" />
            <small>Đối tác dùng tên này để đối chiếu khi nhận phòng.</small>
          </label>
        </section>
        <ContactDetails />
      </div>
      <aside className="sh-panel sh-sticky" aria-label="Tóm tắt yêu cầu">
        <h2>{detail.hotel.name}</h2>
        <PriceSummary
          lines={[
            { label: "Nhận – trả phòng", value: `${formatDate(stay.checkIn)} – ${formatDate(stay.checkOut)}` },
            { label: "Số đêm × số phòng", value: `${stayNights(stay)} × ${stay.rooms}` },
            { label: "Số khách", value: String(stay.guests) },
          ]}
          total={room ? stayEstimate(room, stay) : null}
        />
        <QuoteNotice service="hotel" />
        {error && <p className="sh-error" role="alert">{error}</p>}
        {!hasPhone && <MissingPhoneHint />}
        <button className="btn btn-primary" type="submit" disabled={busy || !hasPhone}>
          {busy ? "Đang gửi yêu cầu…" : "Gửi yêu cầu đặt phòng"}
        </button>
      </aside>
    </form>
  );
}
