"use client";

import { useRouter } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { LOWEST_QUOTE_NOTE, compactPrice, weekdayLabel } from "@/lib/flight-calendar";
import { flightSearchParams } from "@/lib/flight-search";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFlexibleFares } from "@/services/flights";
import type { FlexibleFares, FlightRoute, FlightSearch, RoundTripFare } from "@/types/flight";

interface FlexibleMatrixProps {
  route: FlightRoute;
  search: FlightSearch;
}

/** Outbound day × return day table of the lowest combined quotes within ±3 days; picking a cell re-searches. */
export function FlexibleMatrix({ route, search }: FlexibleMatrixProps) {
  const router = useRouter();
  const key = JSON.stringify({ ...route, date: search.date, returnDate: search.returnDate });
  const { state, retry } = useResource(key, signal =>
    getFlexibleFares(route, search.date, search.returnDate, signal));
  const pick = (fare: RoundTripFare) => router.push("/flights?" + flightSearchParams({
    ...search, date: fare.departDate, returnDate: fare.returnDate,
  }));

  return (
    <section className="fp-calendar fp-matrix" aria-labelledby="fp-matrix-title">
      <h3 id="fp-matrix-title">So sánh ±3 ngày · tổng giá đi + về / khách</h3>
      {state.status === "loading" && <LoadingState label="Đang tải bảng giá…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && <MatrixTable fares={state.data} search={search} onPick={pick} />}
      <p className="fp-note">{LOWEST_QUOTE_NOTE} Tổng hai chiều chỉ để so sánh; mỗi chiều là một đơn riêng.</p>
    </section>
  );
}

interface MatrixTableProps {
  fares: FlexibleFares;
  search: FlightSearch;
  onPick: (fare: RoundTripFare) => void;
}

function MatrixTable({ fares, search, onPick }: MatrixTableProps) {
  const lookup = new Map(fares.roundTrips.map(fare => [`${fare.departDate}|${fare.returnDate}`, fare]));
  return (
    <div className="sf-table-scroll">
      <table className="fp-month fp-matrix-table">
        <caption className="sr-only">Hàng là ngày đi, cột là ngày về</caption>
        <thead>
          <tr>
            <th scope="col">Đi \ Về</th>
            {fares.returnDays.map(day => <th key={day.date} scope="col">{dayHeading(day.date)}</th>)}
          </tr>
        </thead>
        <tbody>
          {fares.outboundDays.map(out => (
            <tr key={out.date}>
              <th scope="row">{dayHeading(out.date)}</th>
              {fares.returnDays.map(back => (
                <td key={back.date}>
                  <MatrixCell fare={lookup.get(`${out.date}|${back.date}`)} onPick={onPick}
                    selected={out.date === search.date && back.date === search.returnDate} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function dayHeading(date: string): string {
  return `${weekdayLabel(date)} ${formatDate(date).slice(0, 5)}`;
}

interface MatrixCellProps {
  fare: RoundTripFare | undefined;
  selected: boolean;
  onPick: (fare: RoundTripFare) => void;
}

function MatrixCell({ fare, selected, onPick }: MatrixCellProps) {
  if (!fare) return <span className="fp-cell is-empty" aria-hidden="true">·</span>;
  const label = `Đi ${formatDate(fare.departDate)}, về ${formatDate(fare.returnDate)}: `
    + (fare.total === null ? "chưa đủ báo giá hai chiều" : "từ " + formatCurrency(fare.total))
    + (fare.isCheapest ? ", rẻ nhất trong bảng" : "");
  const classes = ["fp-cell", fare.isCheapest && "is-cheapest", fare.total === null && "is-empty"]
    .filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} disabled={fare.total === null} aria-label={label}
      aria-current={selected ? "date" : undefined} onClick={() => onPick(fare)}>
      <strong>{fare.total === null ? "—" : compactPrice(fare.total)}</strong>
    </button>
  );
}
