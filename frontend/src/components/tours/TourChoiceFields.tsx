"use client";

import { formatDate } from "@/lib/format";
import { seatLabel } from "@/lib/tour-display";
import type { TourDeparture } from "@/types/tour";

interface TourChoiceFieldsProps {
  departures: TourDeparture[];
  departure: TourDeparture;
  adultCount: number;
  childCount: number;
  maxTravelers: number;
  onDepartureChange: (departureId: string) => void;
  onCountsChange: (adultCount: number, childCount: number) => void;
}

/** Departure and head count: everything a cart line needs, shared by guests and signed-in customers. */
export function TourChoiceFields(props: TourChoiceFieldsProps) {
  const { departures, departure, adultCount, childCount, maxTravelers, onDepartureChange, onCountsChange } = props;
  return (
    <>
      <label className="sh-field">
        Ngày khởi hành
        <select value={departure.id} onChange={event => onDepartureChange(event.target.value)}>
          {departures.map(item => (
            <option key={item.id} value={item.id}>
              {formatDate(item.departureDate)} · {item.departureFrom} · {seatLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <div className="sh-form-grid">
        <CountField label="Người lớn" min={1} max={maxTravelers - childCount} value={adultCount}
          onChange={value => onCountsChange(value, childCount)} />
        <CountField label="Trẻ em" min={0} max={maxTravelers - adultCount} value={childCount}
          onChange={value => onCountsChange(adultCount, value)} />
      </div>
    </>
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
