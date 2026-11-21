"use client";

import { MAX_GUESTS, MAX_ROOMS, addDays } from "@/lib/hotel-stay";
import { vietnamToday } from "@/lib/format";
import type { Stay } from "@/types/hotel";

export function StayFields({ stay, onChange }: { stay: Stay; onChange: (stay: Stay) => void }) {
  const today = vietnamToday();
  return (
    <div className="sh-hotel-stay-fields">
      <label>
        Ngày nhận phòng
        <input type="date" name="checkIn" min={today} required value={stay.checkIn}
          onChange={event => onChange({ ...stay, checkIn: event.target.value })} />
      </label>
      <label>
        Ngày trả phòng
        <input type="date" name="checkOut" min={addDays(stay.checkIn || today, 1)} required value={stay.checkOut}
          onChange={event => onChange({ ...stay, checkOut: event.target.value })} />
      </label>
      <label>
        Số khách
        <input name="guests" type="number" inputMode="numeric" min={1} max={MAX_GUESTS} required
          value={stay.guests || ""}
          onChange={event => onChange({ ...stay, guests: Number(event.target.value) })} />
      </label>
      <label>
        Số phòng
        <input name="rooms" type="number" inputMode="numeric" min={1} max={MAX_ROOMS} required
          value={stay.rooms || ""}
          onChange={event => onChange({ ...stay, rooms: Number(event.target.value) })} />
      </label>
    </div>
  );
}
