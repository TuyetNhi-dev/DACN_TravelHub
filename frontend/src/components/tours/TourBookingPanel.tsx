"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ContactDetails, MissingPhoneHint, useHasContactPhone } from "@/components/bookings/ContactDetails";
import { LoginPrompt } from "@/components/bookings/LoginPrompt";
import { PassengerFields } from "@/components/bookings/PassengerFields";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import {
  MAX_TOUR_TRAVELERS, emptyPassengers, passengersIssue, resizePassengers, trimPassengers,
} from "@/lib/booking-rules";
import { formatCurrency, formatDate } from "@/lib/format";
import { seatLabel, tourEstimate } from "@/lib/tour-display";
import { createTourBooking } from "@/services/bookings";
import type { TourDeparture } from "@/types/tour";

export function TourBookingPanel({ departures }: { departures: TourDeparture[] }) {
  const bookable = departures.filter(departure => departure.isBookable);
  const { session, loading } = useAuth();
  if (bookable.length === 0) {
    return (
      <div className="sh-state">
        <h3>Chưa có lịch mở bán</h3>
        <p>Tour hiện chưa có ngày khởi hành nhận khách. Vui lòng quay lại sau hoặc liên hệ tổng đài.</p>
      </div>
    );
  }
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!session) return <LoginPrompt action="giữ chỗ tour" />;
  return <TourBookingForm departures={bookable} />;
}

function TourBookingForm({ departures }: { departures: TourDeparture[] }) {
  const [departureId, setDepartureId] = useState(departures[0].id);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [passengers, setPassengers] = useState(() => emptyPassengers(1, 0));
  const { submit, busy, error, setError } = useBookingSubmit();
  const hasPhone = useHasContactPhone();
  const departure = departures.find(item => item.id === departureId) ?? departures[0];
  const maxTravelers = Math.min(MAX_TOUR_TRAVELERS, departure.availableSeats);

  function changeCounts(nextAdults: number, nextChildren: number) {
    setAdults(nextAdults);
    setChildren(nextChildren);
    setPassengers(current => resizePassengers(current, nextAdults, nextChildren));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = adults + children > maxTravelers
      ? `Lịch này chỉ nhận tối đa ${maxTravelers} khách cho một đơn.`
      : passengersIssue(passengers);
    if (issue) { setError(issue); return; }
    void submit(() => createTourBooking({
      departureId: departure.id, adultCount: adults, childCount: children, passengers: trimPassengers(passengers),
    }));
  }

  return (
    <form className="sh-form" onSubmit={handleSubmit} aria-describedby="tour-booking-note">
      <label className="sh-field">
        Ngày khởi hành
        <select value={departure.id} onChange={event => setDepartureId(event.target.value)}>
          {departures.map(item => (
            <option key={item.id} value={item.id}>
              {formatDate(item.departureDate)} · {item.departureFrom} · {seatLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <div className="sh-form-grid">
        <CountField label="Người lớn" min={1} max={maxTravelers - children} value={adults}
          onChange={value => changeCounts(value, children)} />
        <CountField label="Trẻ em" min={0} max={maxTravelers - adults} value={children}
          onChange={value => changeCounts(adults, value)} />
      </div>
      <PassengerFields passengers={passengers} onChange={setPassengers} idPrefix="tour-passenger" />
      <ContactDetails />
      <PriceSummary
        lines={[
          {
            label: "Khởi hành – kết thúc",
            value: `${formatDate(departure.departureDate)} – ${formatDate(departure.returnDate)}`,
          },
          { label: `Người lớn × ${adults}`, value: formatCurrency(departure.adultPrice) },
          ...(children > 0
            ? [{ label: `Trẻ em × ${children}`, value: formatCurrency(departure.childPrice ?? departure.adultPrice) }]
            : []),
        ]}
        total={tourEstimate(departure, adults, children)}
      />
      {error && <p className="sh-error" role="alert">{error}</p>}
      {!hasPhone && <MissingPhoneHint />}
      <button className="btn btn-primary" type="submit" disabled={busy || !hasPhone}>
        {busy ? "Đang giữ chỗ…" : "Giữ chỗ ngay"}
      </button>
      <p id="tour-booking-note" className="tour-api-note">
        Hệ thống giữ chỗ ngay khi đặt. Tổng tiền được máy chủ tính lại theo giá của lịch khởi hành;
        nhân viên sẽ liên hệ xác nhận và hướng dẫn thanh toán.
      </p>
    </form>
  );
}

interface CountFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function CountField({ label, min, max, value, onChange }: CountFieldProps) {
  // Keep the current value selectable even when a newly chosen departure has fewer seats; submit re-checks.
  const upper = Math.max(max, value);
  const options = Array.from({ length: Math.max(0, upper - min + 1) }, (_, index) => min + index);
  return (
    <label className="sh-field">
      {label}
      <select value={value} onChange={event => onChange(Number(event.target.value))}>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
