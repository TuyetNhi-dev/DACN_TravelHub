"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { passengerTypeLabel } from "@/lib/admin-departures";
import { bookingProgress, waitingPassengerIds } from "@/lib/check-in";
import { formatTime } from "@/lib/format";
import type { CheckInBooking, CheckInPassenger } from "@/types/ticket";

interface CheckInBookingCardProps {
  booking: CheckInBooking;
  highlighted: boolean;
  /** False when check-in is closed. */
  canWrite: boolean;
  /** A request is running: every action waits for it. */
  busy: boolean;
  canUndo: boolean;
  onCheckIn: (passengerIds: string[]) => void;
  onUndo: (passengerId: string) => void;
}

export function CheckInBookingCard(props: CheckInBookingCardProps) {
  const { booking, highlighted, onCheckIn } = props;
  const enabled = props.canWrite && !props.busy;
  const waiting = waitingPassengerIds(booking);
  // Ticked passengers that are still waiting; a fresh board drops those already checked in.
  const [ticked, setTicked] = useState<string[]>([]);
  const selected = ticked.filter(id => waiting.includes(id));
  const toggle = (id: string) => setTicked(current =>
    current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  return (
    <article className={highlighted ? "checkin-booking is-scanned" : "checkin-booking"}
      aria-labelledby={`checkin-${booking.bookingId}`}>
      <BookingHead booking={booking} />
      <ul className="checkin-passengers">
        {booking.passengers.map(passenger => (
          <PassengerRow key={passenger.id} passenger={passenger} checked={selected.includes(passenger.id)}
            enabled={enabled} canUndo={props.canUndo} onToggle={toggle} onUndo={props.onUndo} />
        ))}
      </ul>
      {waiting.length > 0 && (
        <div className="checkin-actions">
          <button type="button" className="btn btn-primary btn-small" disabled={!enabled || selected.length === 0}
            onClick={() => onCheckIn(selected)} aria-busy={props.busy}>
            {props.busy ? "Đang lưu…" : `Check-in ${selected.length > 0 ? selected.length + " " : ""}khách đã chọn`}
          </button>
          <button type="button" className="btn btn-outline btn-small" disabled={!enabled}
            onClick={() => onCheckIn(waiting)}>
            Check-in cả {waiting.length} khách còn lại
          </button>
        </div>
      )}
    </article>
  );
}

function BookingHead({ booking }: { booking: CheckInBooking }) {
  const { checkedIn, total } = bookingProgress(booking);
  const done = checkedIn === total;
  return (
    <header className="checkin-booking-head">
      <div>
        <h3 id={`checkin-${booking.bookingId}`}>
          <Link href={`/admin/bookings/${encodeURIComponent(booking.bookingId)}`}>{booking.code}</Link>
        </h3>
        <p className="checkin-contact">
          {booking.contactName}
          {booking.contactPhone && <> · <a href={`tel:${booking.contactPhone}`}>{booking.contactPhone}</a></>}
        </p>
      </div>
      <span className={done ? "checkin-count is-done" : "checkin-count"}>
        {done && <Icon name="check" size={14} />}{checkedIn}/{total} đã check-in
      </span>
    </header>
  );
}

interface PassengerRowProps {
  passenger: CheckInPassenger;
  checked: boolean;
  enabled: boolean;
  canUndo: boolean;
  onToggle: (id: string) => void;
  onUndo: (id: string) => void;
}

function PassengerRow({ passenger, checked, enabled, canUndo, onToggle, onUndo }: PassengerRowProps) {
  const type = passengerTypeLabel(passenger.type);
  if (passenger.checkedInAt === null) {
    return (
      <li className={checked ? "is-picked" : undefined}>
        <label className="checkin-pick">
          <input type="checkbox" checked={checked} disabled={!enabled} onChange={() => onToggle(passenger.id)} />
          <span className="checkin-name">{passenger.fullName}<small>{type}</small></span>
        </label>
      </li>
    );
  }
  return (
    <li className="is-boarded">
      <span className="checkin-boarded-mark" aria-hidden="true"><Icon name="check" size={14} /></span>
      <span className="checkin-name">
        {passenger.fullName}
        <small>
          {type} · Đã check-in {formatTime(passenger.checkedInAt)}
          {passenger.checkedInBy && ` bởi ${passenger.checkedInBy}`}
        </small>
      </span>
      {canUndo && (
        <button type="button" className="btn btn-ghost btn-small" disabled={!enabled}
          onClick={() => onUndo(passenger.id)} aria-label={`Hoàn tác check-in của ${passenger.fullName}`}>
          Hoàn tác
        </button>
      )}
    </li>
  );
}
