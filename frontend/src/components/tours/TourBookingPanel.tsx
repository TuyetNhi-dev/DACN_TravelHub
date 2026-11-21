"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ContactDetails, MissingPhoneHint, useHasContactPhone } from "@/components/bookings/ContactDetails";
import { LoginPrompt } from "@/components/bookings/LoginPrompt";
import { PassengerFields } from "@/components/bookings/PassengerFields";
import { PriceSummary } from "@/components/bookings/PriceSummary";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCart } from "@/components/cart/CartProvider";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import {
  MAX_TOUR_TRAVELERS, emptyPassengers, passengersIssue, resizePassengers, trimPassengers,
} from "@/lib/booking-rules";
import { formatCurrency, formatDate } from "@/lib/format";
import { tourEstimate } from "@/lib/tour-display";
import { createTourBooking } from "@/services/bookings";
import type { PassengerInput } from "@/types/booking";
import type { TourDeparture } from "@/types/tour";
import { TourChoiceFields } from "./TourChoiceFields";

interface TourBookingPanelProps {
  departures: TourDeparture[];
  /** Chosen departure, shared with the departure calendar on the page. */
  departureId: string | null;
  onDepartureChange: (departureId: string) => void;
  /** Head count filled in from the cart's "Đặt ngay" link. */
  initialCounts?: { adultCount?: number; childCount?: number };
}

export function TourBookingPanel(props: TourBookingPanelProps) {
  const bookable = props.departures.filter(departure => departure.isBookable);
  const { loading } = useAuth();
  if (bookable.length === 0) {
    return (
      <div className="sh-state">
        <h3>Chưa có lịch mở bán</h3>
        <p>Tour hiện chưa có ngày khởi hành nhận khách. Vui lòng quay lại sau hoặc liên hệ tổng đài.</p>
      </div>
    );
  }
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  return <TourBookingForm {...props} departures={bookable} />;
}

/**
 * Counts from the cart are kept as they are, even above the seats left: silently dropping a traveller would
 * book fewer people than the customer meant. The form shows why it cannot be booked instead.
 */
function startCounts(initial: TourBookingPanelProps["initialCounts"]) {
  const adultCount = Math.min(Math.max(initial?.adultCount ?? 1, 1), MAX_TOUR_TRAVELERS);
  return { adultCount, childCount: Math.min(Math.max(initial?.childCount ?? 0, 0), MAX_TOUR_TRAVELERS - adultCount) };
}

/** Guests choose a departure and head count to put in the cart; booking itself needs an account. */
function TourBookingForm({ departures, departureId, onDepartureChange, initialCounts }: TourBookingPanelProps) {
  const { session } = useAuth();
  const departure = departures.find(item => item.id === departureId) ?? departures[0];
  const maxTravelers = Math.min(MAX_TOUR_TRAVELERS, departure.availableSeats);
  const [counts, setCounts] = useState(() => startCounts(initialCounts));
  const [passengers, setPassengers] = useState(() => emptyPassengers(counts.adultCount, counts.childCount));
  const { adultCount, childCount } = counts;

  function changeCounts(nextAdults: number, nextChildren: number) {
    setCounts({ adultCount: nextAdults, childCount: nextChildren });
    setPassengers(current => resizePassengers(current, nextAdults, nextChildren));
  }

  const choice = { departureId: departure.id, adultCount, childCount };
  const prices = { adult: departure.adultPrice, child: departure.childPrice };
  const tooMany = adultCount + childCount > maxTravelers;
  return (
    <div className="sh-form">
      <TourChoiceFields departures={departures} departure={departure} adultCount={adultCount}
        childCount={childCount} maxTravelers={maxTravelers} onDepartureChange={onDepartureChange}
        onCountsChange={changeCounts} />
      {tooMany && (
        <p className="sh-hint" role="status">
          Lịch này chỉ còn nhận tối đa {maxTravelers} khách cho một đơn. Vui lòng giảm số khách hoặc chọn ngày khác.
        </p>
      )}
      {session ? (
        <BookingFields departure={departure} adultCount={adultCount} childCount={childCount}
          maxTravelers={maxTravelers} passengers={passengers} onPassengersChange={setPassengers}
          cartButton={<AddToCartButton choice={choice} prices={prices} disabled={tooMany} />} />
      ) : (
        <>
          <Estimate departure={departure} adultCount={adultCount} childCount={childCount} />
          <AddToCartButton choice={choice} prices={prices} disabled={tooMany} />
          <LoginPrompt action="giữ chỗ tour" />
        </>
      )}
    </div>
  );
}

interface EstimateProps {
  departure: TourDeparture;
  adultCount: number;
  childCount: number;
}

function Estimate({ departure, adultCount, childCount }: EstimateProps) {
  return (
    <PriceSummary
      lines={[
        {
          label: "Khởi hành – kết thúc",
          value: `${formatDate(departure.departureDate)} – ${formatDate(departure.returnDate)}`,
        },
        { label: `Người lớn × ${adultCount}`, value: formatCurrency(departure.adultPrice) },
        ...(childCount > 0
          ? [{
            label: `Trẻ em × ${childCount}`,
            value: formatCurrency(departure.childPrice ?? departure.adultPrice),
          }]
          : []),
      ]}
      total={tourEstimate(departure, adultCount, childCount)}
    />
  );
}

interface BookingFieldsProps {
  departure: TourDeparture;
  adultCount: number;
  childCount: number;
  maxTravelers: number;
  passengers: PassengerInput[];
  onPassengersChange: (passengers: PassengerInput[]) => void;
  cartButton: ReactNode;
}

function BookingFields(props: BookingFieldsProps) {
  const { departure, adultCount, childCount, maxTravelers, passengers, onPassengersChange, cartButton } = props;
  const { submit, busy, error, setError } = useBookingSubmit();
  const { removeDeparture } = useCart();
  const hasPhone = useHasContactPhone();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = adultCount + childCount > maxTravelers
      ? `Lịch này chỉ nhận tối đa ${maxTravelers} khách cho một đơn.`
      : passengersIssue(passengers);
    if (issue) { setError(issue); return; }
    void submit(async () => {
      const booking = await createTourBooking({
        departureId: departure.id, adultCount, childCount, passengers: trimPassengers(passengers),
      });
      // The departure is booked now, so its cart line (if any) is no longer needed.
      await removeDeparture(departure.id);
      return booking;
    });
  }

  return (
    <form className="sh-form" onSubmit={handleSubmit} aria-describedby="tour-booking-note">
      <PassengerFields passengers={passengers} onChange={onPassengersChange} idPrefix="tour-passenger" />
      <ContactDetails />
      <Estimate departure={departure} adultCount={adultCount} childCount={childCount} />
      {error && <p className="sh-error" role="alert">{error}</p>}
      {!hasPhone && <MissingPhoneHint />}
      <div className="tour-booking-actions">
        <button className="btn btn-primary" type="submit" disabled={busy || !hasPhone}>
          {busy ? "Đang giữ chỗ…" : "Giữ chỗ ngay"}
        </button>
        {cartButton}
      </div>
      <p id="tour-booking-note" className="tour-api-note">
        Hệ thống giữ chỗ ngay khi đặt. Tổng tiền được máy chủ tính lại theo giá của lịch khởi hành;
        nhân viên sẽ liên hệ xác nhận và hướng dẫn thanh toán. Thêm vào giỏ chỉ lưu lựa chọn, chưa giữ chỗ.
      </p>
    </form>
  );
}
