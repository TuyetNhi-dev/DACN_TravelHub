"use client";

import { useEffect, useState } from "react";
import { getTour, getTours } from "@/services/tours";
import { TourCard, type TourCardProps } from "./TourCard";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { filterByDeparture, regionLabel, type Region } from "@/lib/departure-region";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; cards: TourCardProps[]; count: number };

export function FeaturedTours() {
  const { region, choose } = useDeparture();
  if (region === null) return <div className="tour-api-state" role="status">Đang tải lựa chọn khởi hành…</div>;
  return <FeaturedToursContent key={region} region={region} showAll={() => choose("all")} />;
}

function FeaturedToursContent({ region, showAll }: { region: Region; showAll: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const list = await getTours(controller.signal);
        const matching = filterByDeparture(list.data, region);
        // No featured flag exists in the API: preserve its ordering, display the first three.
        const cards = await Promise.all(matching.slice(0, 3).map(async tour => {
          try {
            const detail = await getTour(tour.tourId, controller.signal);
            return { tour: detail.tour, departures: detail.departures };
          } catch {
            // A failed schedule must never be replaced with a fabricated date.
            return { tour, departures: null };
          }
        }));
        if (!controller.signal.aborted) setState({ status: "ready", cards, count: matching.length });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, region]);

  function retry() {
    setState({ status: "loading" });
    setAttempt(value => value + 1);
  }

  if (state.status === "loading") return (
    <div className="tour-api-state" role="status" aria-busy="true">Đang tải tour và lịch khởi hành…</div>
  );
  if (state.status === "error") return (
    <div className="tour-api-state" role="alert">
      <h3>Chưa thể tải danh sách tour</h3>
      <p>Vui lòng kiểm tra kết nối hoặc thử lại sau.</p>
      <button className="btn btn-outline" onClick={retry}>Thử lại</button>
    </div>
  );
  if (!state.cards.length) return (
    <div className="tour-api-state" role="status"><p>Chưa có tour phù hợp với {regionLabel(region)}.</p><button className="btn btn-outline" onClick={showAll}>Xem tất cả tour</button></div>
  );
  return (
    <>
      <p className="tour-api-note" role="status">Hiển thị {state.cards.length}/{state.count} tour đầu tiên từ hệ thống.
        Khu vực: {regionLabel(region)}. Phân loại dữ liệu theo từng tour; ảnh chỉ mang tính minh họa.
        {region !== "all" && <button className="btn btn-ghost" onClick={showAll}>Xem tất cả tour</button>}</p>
      {state.cards.some(card => card.departures === null) && (
        <div className="tour-api-note" role="status">
          Một số lịch khởi hành chưa tải được. <button className="btn btn-outline" onClick={retry}>Tải lại</button>
        </div>
      )}
      <div className="tour-grid">{state.cards.map(card => <TourCard key={card.tour.tourId} {...card} />)}</div>
    </>
  );
}
