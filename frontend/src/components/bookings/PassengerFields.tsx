"use client";

import { PASSENGER_LABELS } from "@/lib/booking-rules";
import { vietnamToday } from "@/lib/format";
import type { PassengerInput, PassengerType } from "@/types/booking";

interface PassengerFieldsProps {
  passengers: PassengerInput[];
  onChange: (passengers: PassengerInput[]) => void;
  idPrefix: string;
  /** Flights let each traveller be adult or child; tours fix the mix through the counters instead. */
  typeEditable?: boolean;
}

const PASSENGER_TYPES = Object.entries(PASSENGER_LABELS) as [PassengerType, string][];

export function PassengerFields({ passengers, onChange, idPrefix, typeEditable = false }: PassengerFieldsProps) {
  function update(index: number, patch: Partial<PassengerInput>) {
    onChange(passengers.map((passenger, i) => (i === index ? { ...passenger, ...patch } : passenger)));
  }

  return (
    <div className="sh-passengers">
      {passengers.map((passenger, index) => {
        const id = `${idPrefix}-${index}`;
        return (
          <div className="sh-passenger" key={id}>
            {typeEditable ? (
              <label className="sh-field" htmlFor={`${id}-type`}>
                Khách {index + 1}
                <select id={`${id}-type`} value={passenger.passengerType}
                  onChange={event => update(index, { passengerType: event.target.value as PassengerType })}>
                  {PASSENGER_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            ) : (
              <span className="sh-passenger-type">{index + 1}. {PASSENGER_LABELS[passenger.passengerType]}</span>
            )}
            <label className="sh-field" htmlFor={`${id}-name`}>
              Họ và tên (như trên giấy tờ)
              <input
                id={`${id}-name`}
                value={passenger.fullName}
                onChange={event => update(index, { fullName: event.target.value })}
                autoComplete="off"
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <label className="sh-field" htmlFor={`${id}-birth`}>
              Ngày sinh <small>(không bắt buộc)</small>
              <input
                id={`${id}-birth`}
                type="date"
                max={vietnamToday()}
                value={passenger.birthDate ?? ""}
                onChange={event => update(index, { birthDate: event.target.value || null })}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
