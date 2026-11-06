"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getTours, getTour } from "@/services/tours";
import { getHomeCatalog, type CatalogItem } from "@/services/home-catalog";
import { normalizeSearch } from "@/lib/format";
import { CatalogCards } from "./HomeCatalog";
import { filterByDeparture, regionLabel } from "@/lib/departure-region";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { tourHref, tourPrice } from "@/lib/tour-display";
import type { Tour } from "@/types/tour";

type Tab = "tour" | "hotel" | "flight";
type Results =
  | { kind: "tour"; items: Tour[] }
  | { kind: "hotel" | "flight"; items: CatalogItem[] };

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: "tour", label: "Tour du lịch", icon: "ticket" },
  { id: "hotel", label: "Khách sạn", icon: "hotel" },
  { id: "flight", label: "Vé máy bay", icon: "plane" },
];

export function HomeSearch() {
  const { region } = useDeparture();
  return <HomeSearchForm key={region || "all"} />;
}

function HomeSearchForm() {
  const { region } = useDeparture();
  const [tab, setTab] = useState<Tab>("tour");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  function changeTab(value: Tab) {
    request.current?.abort();
    setTab(value);
    setResults(null);
    setStatus("idle");
    setDate("");
  }

  async function search() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    setResults(null);
    const destinationText = normalizeSearch(destination);
    const originText = normalizeSearch(origin);
    const matches = (value: string) => normalizeSearch(value).includes(destinationText);

    try {
      if (tab === "tour") {
        const response = await getTours(controller.signal);
        let items = filterByDeparture(response.data, region || "all")
          .filter(tour => matches([tour.tenTour, tour.diemDen, tour.tourId].join(" ")));

        if (date) {
          const selected: Tour[] = [];
          for (let index = 0; index < items.length; index += 5) {
            const batch = await Promise.all(items.slice(index, index + 5).map(async tour => {
              const detail = await getTour(tour.tourId, controller.signal);
              return detail.departures.some(departure => departure.ngayKhoiHanh === date) ? tour : null;
            }));
            selected.push(...batch.filter((tour): tour is Tour => tour !== null));
          }
          items = selected;
        }

        if (!controller.signal.aborted) setResults({ kind: "tour", items });
      } else {
        const catalog = await getHomeCatalog(tab, controller.signal);
        const items = catalog.filter(item => {
          if (!matches(item.title + " " + item.location)) return false;
          if (tab !== "flight") return true;

          const matchesOrigin = !originText || normalizeSearch(item.origin || "").includes(originText);
          const matchesDate = !date || item.date === date;
          return matchesOrigin && matchesDate;
        });

        if (!controller.signal.aborted) setResults({ kind: tab, items });
      }

      if (!controller.signal.aborted) setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }

  let searchMessage = "Tìm chuyến một chiều trong danh mục hệ thống; chưa hỗ trợ đặt vé.";
  if (tab === "tour") {
    searchMessage = "Khởi hành: " + regionLabel(region || "all") + ". Để trống ngày để xem mọi lịch.";
  } else if (tab === "hotel") {
    searchMessage = "Tìm trong danh mục hệ thống; chưa kiểm tra phòng trống theo ngày hoặc số khách.";
  }

  return (
    <div className="search-box">
      <div className="search-tabs" role="group" aria-label="Loại dịch vụ">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            className={tab === item.id ? "selected" : ""}
            onClick={() => changeTab(item.id)}
          >
            <Icon name={item.icon} size={18} />{item.label}
          </button>
        ))}
      </div>
      <form
        className="search-fields"
        role="search"
        aria-label="Tìm dịch vụ du lịch"
        onSubmit={event => { event.preventDefault(); void search(); }}
      >
        {tab === "flight" && (
          <label className="search-field">
            <span className="field-icon"><Icon name="plane" /></span>
            <span>
              <small>Điểm đi</small>
              <input value={origin} onChange={event => setOrigin(event.target.value)} placeholder="Tất cả điểm đi" maxLength={200} />
            </span>
          </label>
        )}
        <label className="search-field">
          <span className="field-icon"><Icon name="map" /></span>
          <span>
            <small>{tab === "hotel" ? "Khách sạn hoặc địa điểm" : "Bạn muốn đi đâu?"}</small>
            <input
              value={destination}
              onChange={event => setDestination(event.target.value)}
              placeholder="Tên dịch vụ, điểm đến…"
              maxLength={200}
            />
          </span>
        </label>
        {tab !== "hotel" && (
          <label className="search-field">
            <span className="field-icon"><Icon name="calendar" /></span>
            <span>
              <small>{tab === "flight" ? "Ngày bay (một chiều)" : "Ngày khởi hành"}</small>
              <input type="date" value={date} onChange={event => setDate(event.target.value)} />
            </span>
          </label>
        )}
        <button className="search-submit" type="submit" disabled={status === "loading"}>
          <Icon name="search" /><span>{status === "loading" ? "Đang tìm…" : "Tìm kiếm"}</span>
        </button>
      </form>
      <p className="search-message">{searchMessage}</p>
      <div className="home-search-results" aria-live="polite" aria-busy={status === "loading"}>
        {status === "ready" && results && <h3>{results.items.length} kết quả tìm kiếm</h3>}
        {status === "loading" && <p>Đang tìm dữ liệu phù hợp…</p>}
        {status === "error" && (
          <div role="alert">
            <p>Chưa thể tải đủ dữ liệu để tìm kiếm. Vui lòng thử lại.</p>
            <button className="btn btn-outline" onClick={() => void search()}>Thử lại</button>
          </div>
        )}
        {results && results.items.length === 0 && (
          <p>Không tìm thấy dịch vụ phù hợp. Thử điểm đến khác, bỏ ngày hoặc đổi điểm khởi hành ở Header.</p>
        )}
        {results?.kind === "tour" && (
          <ul>
            {results.items.map(tour => (
              <li key={tour.tourId}>
                <Link href={tourHref(tour.tourId)}>{tour.tenTour || tour.tourId} <Icon name="arrow" size={16} /></Link>
                <span>
                  {tour.diemKhoiHanh} → {tour.diemDen} · {tourPrice(tour.giaNguoiLonVnd)} · {tour.loaiDuLieu || "Chưa phân loại dữ liệu"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {results && results.kind !== "tour" && <CatalogCards items={results.items} kind={results.kind} />}
      </div>
    </div>
  );
}
