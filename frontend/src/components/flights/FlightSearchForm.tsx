"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AIRPORTS, CABIN_CLASSES, MAX_FLIGHT_PASSENGERS, flightSearchParams, validateFlightSearch,
} from "@/lib/flight-search";
import { vietnamToday } from "@/lib/format";
import type { CabinClass, FlightSearch } from "@/types/flight";

const PASSENGER_OPTIONS = Array.from({ length: MAX_FLIGHT_PASSENGERS }, (_, index) => index + 1);

export function FlightSearchForm({ initial }: { initial: FlightSearch }) {
  const router = useRouter();
  const [search, setSearch] = useState(initial);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateFlightSearch(search);
    setError(issue ?? "");
    if (!issue) router.push("/flights?" + flightSearchParams(search));
  }

  return (
    <form className="sf-panel sf-search" onSubmit={submit} aria-label="Tìm chuyến bay">
      <AirportField id="sf-from" label="Điểm đi" value={search.from}
        onChange={from => setSearch({ ...search, from })} />
      <button type="button" className="btn btn-outline sf-swap" aria-label="Đổi điểm đi và điểm đến"
        onClick={() => setSearch({ ...search, from: search.to, to: search.from })}>⇄</button>
      <AirportField id="sf-to" label="Điểm đến" value={search.to} onChange={to => setSearch({ ...search, to })} />
      <label>
        Ngày bay
        <input required type="date" min={vietnamToday()} value={search.date}
          onChange={event => setSearch({ ...search, date: event.target.value })} />
      </label>
      <label>
        Hành khách
        <select value={search.passengers}
          onChange={event => setSearch({ ...search, passengers: Number(event.target.value) })}>
          {PASSENGER_OPTIONS.map(count => <option key={count} value={count}>{count} hành khách</option>)}
        </select>
      </label>
      <label>
        Hạng vé
        <select value={search.cabin} onChange={event => setSearch({ ...search, cabin: event.target.value as CabinClass })}>
          {CABIN_CLASSES.map(cabin => <option key={cabin.value} value={cabin.value}>{cabin.label}</option>)}
        </select>
      </label>
      <button className="btn btn-primary" type="submit">Tìm chuyến bay</button>
      {error && <p role="alert" className="sf-error sf-wide">{error}</p>}
    </form>
  );
}

interface AirportFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function AirportField({ id, label, value, onChange }: AirportFieldProps) {
  return (
    <label>
      {label}
      <input required list={id} value={value} maxLength={100} placeholder="Thành phố hoặc mã sân bay"
        onChange={event => onChange(event.target.value)} />
      <datalist id={id}>
        {AIRPORTS.map(([code, city, airport]) => <option key={code} value={code}>{city} · {airport}</option>)}
      </datalist>
    </label>
  );
}
