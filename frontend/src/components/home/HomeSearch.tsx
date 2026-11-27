"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { addDays, stayParams } from "@/lib/hotel-stay";
import { airportCode, flightSearchParams } from "@/lib/flight-search";
import { vietnamToday } from "@/lib/format";

type Tab = "tour" | "hotel" | "flight";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "tour", label: "Tour du lịch", icon: "ticket" },
  { id: "hotel", label: "Khách sạn", icon: "hotel" },
  { id: "flight", label: "Vé máy bay", icon: "plane" },
];

const HINTS: Record<Tab, string> = {
  tour: "Tour trọn gói giữ chỗ ngay khi đặt.",
  hotel: "Giá phòng là giá hợp đồng với đối tác, chờ xác nhận còn phòng khi đặt.",
  flight: "Giá vé là giá hợp đồng với đối tác, chờ xác nhận còn chỗ khi đặt.",
};

/** Hands the search to the matching listing page, where filtering happens against the API. */
export function HomeSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tour");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("SGN");
  const [date, setDate] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(targetUrl(tab, destination.trim(), origin, date));
  }

  return (
    <div className="search-box">
      <div className="search-tabs" role="group" aria-label="Loại dịch vụ">
        {TABS.map(item => (
          <button key={item.id} type="button" aria-pressed={tab === item.id}
            className={tab === item.id ? "selected" : ""} onClick={() => setTab(item.id)}>
            <Icon name={item.icon} size={18} />{item.label}
          </button>
        ))}
      </div>
      <form className="search-fields" role="search" aria-label="Tìm dịch vụ du lịch" onSubmit={search}>
        {tab === "flight" && (
          <SearchField icon="plane" label="Điểm đi">
            <input value={origin} onChange={event => setOrigin(event.target.value)}
              placeholder="Thành phố hoặc mã sân bay" maxLength={100} />
          </SearchField>
        )}
        <SearchField icon="map" label={tab === "hotel" ? "Khách sạn hoặc thành phố" : "Bạn muốn đi đâu?"}>
          <input value={destination} onChange={event => setDestination(event.target.value)}
            placeholder={tab === "flight" ? "Ví dụ: Hà Nội hoặc HAN" : "Tên điểm đến…"} maxLength={200} />
        </SearchField>
        <SearchField icon="calendar" label={DATE_LABELS[tab]}>
          <input type="date" min={vietnamToday()} value={date} onChange={event => setDate(event.target.value)} />
        </SearchField>
        <button className="search-submit" type="submit"><Icon name="search" /><span>Tìm kiếm</span></button>
      </form>
      <p className="search-message">{HINTS[tab]}</p>
    </div>
  );
}

const DATE_LABELS: Record<Tab, string> = { tour: "Ngày khởi hành", hotel: "Ngày nhận phòng", flight: "Ngày bay" };

function SearchField({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <label className="search-field">
      <span className="field-icon"><Icon name={icon} /></span>
      <span><small>{label}</small>{children}</span>
    </label>
  );
}

function targetUrl(tab: Tab, destination: string, origin: string, date: string): string {
  if (tab === "tour") {
    const params = new URLSearchParams();
    if (destination) params.set("q", destination);
    if (date) params.set("date", date);
    return "/tours?" + params;
  }
  if (tab === "hotel") {
    const checkIn = date || addDays(vietnamToday(), 1);
    const params = stayParams({ checkIn, checkOut: addDays(checkIn, 1), guests: 2, rooms: 1 });
    if (destination) params.set("q", destination);
    return "/hotels?" + params;
  }
  return "/flights?" + flightSearchParams({
    from: airportCode(origin) || origin, to: airportCode(destination) || destination,
    date: date || vietnamToday(), passengers: 1, cabin: "economy",
  });
}
