"use client";

import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { DEAL_ORIGINS, DEAL_WINDOW_DAYS } from "@/lib/flight-deals";
import { getFlightDeals } from "@/services/flights";
import { DealNotice } from "./DealBadges";
import { FlightDealCard } from "./FlightDealCard";
import { FlightTabs } from "./FlightTabs";

/** "Săn vé rẻ": one headline deal (allotment seats left) per route for the next 30 days, filterable by origin. */
export function FlightDealsPage({ origin }: { origin: string }) {
  const { state, retry } = useResource(`deals:${origin}`, signal => getFlightDeals(origin, signal));
  return (
    <main id="main-content" className="sf">
      <section className="sf-hero"><div className="container">
        <FlightTabs current="deals" />
        <span className="kicker">SÀIHÀNH · VÉ MÁY BAY · SĂN VÉ RẺ</span>
        <h1>Săn vé tốt,<br /><em>bay đúng lúc.</em></h1>
        <p>
          Vé deal từ quỹ ghế SàiHành: giá tốt của từng chặng trong {DEAL_WINDOW_DAYS} ngày tới, xác nhận ngay khi
          thanh toán.
        </p>
      </div></section>
      <div className="container sf-body">
        <nav className="fd-origins" aria-label="Lọc theo điểm đi">
          {DEAL_ORIGINS.map(item => (
            <Link key={item.code} href={item.code ? `/flights/deals?from=${item.code}` : "/flights/deals"}
              aria-current={item.code === origin ? "page" : undefined}
              className={item.code === origin ? "fd-chip is-active" : "fd-chip"}>
              {item.label}
            </Link>
          ))}
        </nav>
        <DealNotice />
        {state.status === "loading" && <LoadingState label="Đang tìm giá tốt…" />}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
        {state.status === "ready" && state.data.length === 0 && (
          <EmptyState title="Chưa có vé deal phù hợp">
            <p>
              Hiện chưa có vé deal còn ghế từ điểm đi này trong {DEAL_WINDOW_DAYS} ngày tới. Hãy chọn điểm đi khác.
            </p>
          </EmptyState>
        )}
        {state.status === "ready" && state.data.length > 0 && (
          <ul className="fd-grid">
            {state.data.map(deal => <li key={deal.offerId}><FlightDealCard deal={deal} /></li>)}
          </ul>
        )}
      </div>
    </main>
  );
}
