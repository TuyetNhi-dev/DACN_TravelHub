"use client";

import { useState } from "react";
import Link from "next/link";
import { airportCode, airportLabel, flightSearchParams, flightTotal, returnLegSearch } from "@/lib/flight-search";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FlightOffer, FlightSearch } from "@/types/flight";
import { FlexibleMatrix } from "./FlexibleMatrix";
import { FlightLegOffers } from "./FlightList";

/** Mandatory wording: a round trip is two independent one-way orders, not one guaranteed package. */
export const SEPARATE_ORDERS_NOTE = "Khứ hồi được đặt thành 2 đơn riêng, mỗi chiều xác nhận và thanh toán riêng "
  + "(vé deal xác nhận ngay khi thanh toán, vé thường chờ đối tác). Một chiều có thể thành công trong khi chiều kia "
  + "hết chỗ.";

interface Selection {
  outbound: FlightOffer | null;
  inbound: FlightOffer | null;
}

export function RoundTripResults({ search }: { search: FlightSearch }) {
  const [selection, setSelection] = useState<Selection>({ outbound: null, inbound: null });
  const route = { from: airportCode(search.from), to: airportCode(search.to), cabin: search.cabin };
  const back = returnLegSearch(search);

  return (
    <section aria-label="Kết quả chuyến bay khứ hồi">
      <div className="sf-results-title">
        <div>
          <span className="kicker">KHỨ HỒI · 2 ĐƠN RIÊNG</span>
          <h2>{airportLabel(route.from)} ⇄ {airportLabel(route.to)}</h2>
          <p>Đi {formatDate(search.date)} · Về {formatDate(back.date)} · {search.passengers} hành khách</p>
        </div>
      </div>
      <p className="fp-separate" role="note">{SEPARATE_ORDERS_NOTE}</p>
      {search.flexible && <FlexibleMatrix route={route} search={search} />}
      <LegSection title={`Chiều đi · ${formatDate(search.date)}`} search={search}
        chosen={selection.outbound} actionLabel="Chọn chiều đi"
        onChoose={offer => setSelection(current => ({ ...current, outbound: offer }))} />
      <LegSection title={`Chiều về · ${formatDate(back.date)}`} search={back}
        chosen={selection.inbound} actionLabel="Chọn chiều về"
        onChoose={offer => setSelection(current => ({ ...current, inbound: offer }))} />
      <SelectionBar search={search} selection={selection} />
    </section>
  );
}

interface LegSectionProps {
  title: string;
  search: FlightSearch;
  chosen: FlightOffer | null;
  actionLabel: string;
  onChoose: (offer: FlightOffer) => void;
}

function LegSection({ title, search, chosen, actionLabel, onChoose }: LegSectionProps) {
  return (
    <section className="fp-leg" aria-label={title}>
      <h3>{title}</h3>
      <FlightLegOffers search={search} renderAction={offer => {
        const selected = chosen?.offerId === offer.offerId;
        return (
          <button type="button" className={selected ? "btn btn-primary" : "btn btn-outline"} aria-pressed={selected}
            onClick={() => onChoose(offer)}>
            {selected ? "✓ Đã chọn" : actionLabel}
          </button>
        );
      }} />
    </section>
  );
}

function SelectionBar({ search, selection }: { search: FlightSearch; selection: Selection }) {
  const { outbound, inbound } = selection;
  if (!outbound && !inbound) return null;
  const total = (outbound ? flightTotal(outbound, search.passengers) : 0)
    + (inbound ? flightTotal(inbound, search.passengers) : 0);
  const params = flightSearchParams(search);
  if (outbound) params.set("offer", outbound.offerId);
  if (inbound) params.set("returnOffer", inbound.offerId);

  return (
    <div className="fp-selection" role="region" aria-label="Chuyến đã chọn">
      <p>
        {outbound ? `Đi: ${outbound.flightNumber}` : "Chưa chọn chiều đi"}
        {" · "}
        {inbound ? `Về: ${inbound.flightNumber}` : "Chưa chọn chiều về"}
        <br />
        <strong>{formatCurrency(total)}</strong> tạm tính cho {search.passengers} khách · giá tham khảo
      </p>
      {outbound && inbound
        ? <Link className="btn btn-primary" href={"/flights/booking?" + params}>Tiếp tục đặt 2 chiều</Link>
        : <span className="fp-selection-hint">Chọn đủ hai chiều để tiếp tục.</span>}
    </div>
  );
}
