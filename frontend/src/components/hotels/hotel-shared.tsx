"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { getHotel, getHotels } from "@/services/hotels";
import { stayParams, vietnamToday } from "@/lib/hotel-stay";
import type { Hotel, HotelDetail, HotelSource, Stay } from "@/types/hotel";

type DataState =
  | { status: "loading" }
  | { status: "error" | "missing" }
  | { status: "ready"; hotels: Hotel[]; detail: HotelDetail | null };

export function useHotelResource(source: HotelSource, hotelId?: string) {
  const [state, setState] = useState<DataState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        let hotels: Hotel[];
        let detail: HotelDetail | null = null;

        if (source === "demo") {
          const { demoHotelDetails } = await import("@/data/hotels-demo");
          hotels = demoHotelDetails.map(item => item.hotel);
          if (hotelId) {
            detail = demoHotelDetails.find(item => item.hotel.hotelId === hotelId) || null;
            if (!detail) throw new ApiError("Không tìm thấy khách sạn demo.", 404);
          }
        } else if (hotelId) {
          detail = await getHotel(hotelId, controller.signal);
          hotels = [detail.hotel];
        } else {
          hotels = await getHotels(controller.signal);
        }

        if (!controller.signal.aborted) setState({ status: "ready", hotels, detail });
      } catch (error) {
        if (!controller.signal.aborted) {
          const status = error instanceof ApiError && error.status === 404 ? "missing" : "error";
          setState({ status });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [source, hotelId, attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt(value => value + 1);
  }

  return { state, retry };
}

export function HotelStatus({ status, retry }: {
  status: "loading" | "error" | "missing";
  retry: () => void;
}) {
  if (status === "loading") {
    return (
      <div className="sh-hotel-loading" role="status" aria-busy="true">
        <p>Đang tải thông tin lưu trú…</p>
        <div /><div /><div />
      </div>
    );
  }

  const missing = status === "missing";
  return (
    <div className="sh-hotel-panel sh-hotel-empty" role={missing ? "status" : "alert"}>
      <h2>{missing ? "Không tìm thấy khách sạn" : "Chưa tải được dữ liệu khách sạn"}</h2>
      <p>
        {missing
          ? "Khách sạn không tồn tại trong nguồn dữ liệu đang chọn."
          : "Vui lòng kiểm tra kết nối và thử lại. Không thay thế dữ liệu API bằng giá hoặc phòng giả định."}
      </p>
      <div className="sh-hotel-actions">
        {!missing && <button className="btn btn-primary" onClick={retry}>Thử lại</button>}
        <Link className="btn btn-outline" href="/hotels">Danh sách khách sạn</Link>
        <Link className="btn btn-outline" href="/hotels?source=demo">Khám phá dữ liệu demo</Link>
      </div>
    </div>
  );
}

export function HotelSourceNotice({ source, stay }: { source: HotelSource; stay?: Stay }) {
  const isDemo = source === "demo";
  const nextSource = isDemo ? "api" : "demo";
  const params = stay ? stayParams(stay, nextSource) : new URLSearchParams({ source: nextSource });

  return (
    <div className="sh-hotel-source">
      <div>
        <strong>{isDemo ? "BẠN ĐANG XEM DỮ LIỆU DEMO" : "DANH MỤC TỪ HỆ THỐNG"}</strong>
        <p>
          {isDemo
            ? "Khách sạn, giá và số phòng là dữ liệu giả định để trải nghiệm giao diện."
            : "Dữ liệu API có thể bao gồm bản ghi demo. Giá và số phòng trong danh mục chưa xác nhận tình trạng theo ngày."}
          {" "}Mọi thao tác đặt phòng tại đây đều là mô phỏng.
        </p>
      </div>
      <Link href={"/hotels?" + params} className="btn btn-outline">
        {isDemo ? "Xem danh mục API" : "Thử giao diện với demo"}
      </Link>
    </div>
  );
}

export function StayFields({ stay, onChange, optionalDates = false }: {
  stay: Stay;
  onChange: (stay: Stay) => void;
  optionalDates?: boolean;
}) {
  const today = vietnamToday();

  return (
    <div className="sh-hotel-stay-fields">
      <label>
        Ngày nhận phòng{optionalDates && " (tùy chọn)"}
        <input
          type="date"
          name="checkIn"
          min={today}
          value={stay.checkIn}
          required={!optionalDates}
          onChange={event => onChange({ ...stay, checkIn: event.target.value })}
        />
      </label>
      <label>
        Ngày trả phòng{optionalDates && " (tùy chọn)"}
        <input
          type="date"
          name="checkOut"
          min={stay.checkIn || today}
          value={stay.checkOut}
          required={!optionalDates}
          onChange={event => onChange({ ...stay, checkOut: event.target.value })}
        />
      </label>
      <label>
        Số khách
        <input
          name="guests"
          type="number"
          min={1}
          max={20}
          required
          value={stay.guests || ""}
          onChange={event => onChange({ ...stay, guests: Number(event.target.value) })}
        />
      </label>
      <label>
        Số phòng
        <input
          name="rooms"
          type="number"
          min={1}
          max={10}
          required
          value={stay.rooms || ""}
          onChange={event => onChange({ ...stay, rooms: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}

export function HotelBreadcrumb({ title, source, hotelId, hotelName }: {
  title: string;
  source: HotelSource;
  hotelId?: string;
  hotelName?: string;
}) {
  return (
    <nav className="sh-hotel-breadcrumb" aria-label="Đường dẫn">
      <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span>
      <Link href={"/hotels?source=" + source}>Khách sạn</Link>
      {hotelId && (
        <>
          <span aria-hidden="true">/</span>
          <Link href={"/hotels/" + encodeURIComponent(hotelId) + "?source=" + source}>{hotelName || "Chi tiết"}</Link>
        </>
      )}
      <span aria-hidden="true">/</span><span aria-current="page">{title}</span>
    </nav>
  );
}
