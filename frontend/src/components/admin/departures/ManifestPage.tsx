"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { DEPARTURES_HREF, manifestSummary } from "@/lib/admin-departures";
import { checkInHref } from "@/lib/check-in";
import { formatDate } from "@/lib/format";
import { getManifest, manifestExcelHref } from "@/services/admin-catalog";
import type { Manifest } from "@/types/admin";
import { ManifestBookings } from "./ManifestBookings";

/** "Danh sách đoàn" of one departure: passengers' personal data, visible only inside the admin scope. */
export function ManifestPage({ departureId }: { departureId: string }) {
  const { state, retry } = useResource(`admin-manifest:${departureId}`, signal => getManifest(departureId, signal));
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Lịch khởi hành", href: DEPARTURES_HREF }, { label: "Danh sách đoàn" }]} />
        <h1>Danh sách đoàn</h1>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tải danh sách đoàn…" />}
      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={retry} backHref={DEPARTURES_HREF} backLabel="Lịch khởi hành" />
      )}
      {state.status === "ready" && <ManifestView manifest={state.data} />}
    </main>
  );
}

function ManifestView({ manifest }: { manifest: Manifest }) {
  const { departure } = manifest;
  const summary = manifestSummary(manifest);
  return (
    <>
      <section className="adm-panel" aria-labelledby="manifest-departure">
        <div className="adm-panel-head">
          <h2 id="manifest-departure">{departure.tourCode} · {departure.tourTitle}</h2>
          <span className="adm-actions">
            <Link className="btn btn-primary btn-small" href={checkInHref(departure.id)}>Check-in đoàn</Link>
            <a className="btn btn-outline btn-small" href={manifestExcelHref(departure.id)} download>Tải file Excel</a>
          </span>
        </div>
        <p className="adm-note">
          Khởi hành {formatDate(departure.departureDate)} từ {departure.departureFrom},
          {" "}về {formatDate(departure.returnDate)} · {departure.branchName}
        </p>
        <dl className="adm-stats">
          <div><dt>Khách trong danh sách</dt><dd>{summary.guests}</dd></div>
          <div><dt>Số đơn</dt><dd>{summary.bookings}</dd></div>
          <div><dt>Chỗ đã giữ</dt><dd>{departure.reservedSeats} / {departure.capacity}</dd></div>
          <div><dt>Tối thiểu để khởi hành</dt><dd>{departure.minGuests} khách</dd></div>
        </dl>
        {summary.belowMinimum && <p className="adm-warn" role="status">Lịch này chưa đủ số khách tối thiểu.</p>}
        {summary.heldOutsideList > 0 && (
          <p className="adm-note">
            {summary.heldOutsideList} chỗ đã giữ không thuộc đơn nào trong danh sách (ví dụ chỗ bán ngoài hệ thống).
          </p>
        )}
      </section>
      {manifest.bookings.length === 0
        ? <EmptyState title="Chưa có đơn nào giữ chỗ cho lịch này" />
        : <ManifestBookings bookings={manifest.bookings} />}
    </>
  );
}
