"use client";

import { useState, type FormEvent } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useCheckInBoard, type CheckInMessage } from "@/hooks/useCheckInBoard";
import { DEPARTURES_HREF } from "@/lib/admin-departures";
import {
  PROGRESS_FILTERS, filterCheckInBookings, findBooking, isTicketPayload, matchesProgress, type ProgressFilter,
} from "@/lib/check-in";
import type { CheckInBoard, CheckInBooking } from "@/types/ticket";
import { CheckInBookingCard } from "./CheckInBookingCard";
import { CheckInScanner } from "./CheckInScanner";
import { CheckInSummary } from "./CheckInSummary";
import "@/styles/check-in.css";

type BoardActions = ReturnType<typeof useCheckInBoard>;

export function CheckInPage({ departureId }: { departureId: string }) {
  const actions = useCheckInBoard(departureId);
  const { state, retry } = actions;
  const manifestHref = `/admin/departures/${encodeURIComponent(departureId)}/manifest`;
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <Breadcrumb items={[
          { label: "Lịch khởi hành", href: DEPARTURES_HREF }, { label: "Danh sách đoàn", href: manifestHref },
          { label: "Check-in" },
        ]} />
        <h1>Check-in đoàn</h1>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tải danh sách check-in…" />}
      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={retry} backHref={DEPARTURES_HREF} backLabel="Lịch khởi hành" />
      )}
      {state.status === "ready" && <CheckInView board={state.data} actions={actions} />}
    </main>
  );
}

function CheckInView({ board, actions }: { board: CheckInBoard; actions: BoardActions }) {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<ProgressFilter>("all");
  const open = board.closedReason === null;
  const search = isTicketPayload(query) ? "" : query;
  const listed = filterCheckInBookings(board.bookings, search).filter(b => matchesProgress(b, progress));

  return (
    <>
      <CheckInSummary board={board} />
      <div className="checkin-layout">
        <div className="checkin-tools">
          <CheckInScanner disabled={!open || !board.canScan || actions.busy}
            onDetect={text => void actions.scan(text)} />
          <Feedback message={actions.message} onReload={actions.retry} />
        </div>
        <div className="checkin-main">
          <SearchBar query={query} onQuery={setQuery} progress={progress} onProgress={setProgress}
            canScan={open && !actions.busy} onScan={payload => void actions.scan(payload)}
            shown={listed.length} total={board.bookings.length} />
          <BookingList board={board} actions={actions} listed={listed} />
        </div>
      </div>
    </>
  );
}

interface SearchBarProps {
  query: string;
  onQuery: (value: string) => void;
  progress: ProgressFilter;
  onProgress: (value: ProgressFilter) => void;
  canScan: boolean;
  onScan: (payload: string) => void;
  shown: number;
  total: number;
}

/** One box for both: a typed search filters the list, a pasted QR text is checked by the server on Enter. */
function SearchBar({ query, onQuery, progress, onProgress, canScan, onScan, shown, total }: SearchBarProps) {
  const payload = isTicketPayload(query);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!payload || !canScan) return;
    onScan(query);
    onQuery("");
  }
  return (
    <form className="adm-panel checkin-search" role="search" onSubmit={submit}>
      <label htmlFor="checkin-query">Tìm theo mã đơn, tên khách hoặc dán nội dung mã QR</label>
      <div className="checkin-search-row">
        <span className="checkin-search-field">
          <Icon name="search" size={18} />
          <input id="checkin-query" type="search" value={query} onChange={event => onQuery(event.target.value)}
            autoComplete="off" spellCheck={false} />
        </span>
        {payload && (
          <button type="submit" className="btn btn-primary btn-small" disabled={!canScan}>Kiểm tra vé</button>
        )}
      </div>
      <div className="checkin-search-foot">
        <div className="checkin-filter" role="group" aria-label="Lọc theo tiến độ check-in">
          {PROGRESS_FILTERS.map(item => (
            <button key={item.id} type="button" aria-pressed={progress === item.id}
              onClick={() => onProgress(item.id)}>{item.label}</button>
          ))}
        </div>
        <span className="checkin-count-note" aria-live="polite">Hiển thị {shown}/{total} đơn</span>
      </div>
    </form>
  );
}

/** The scanned order first, then every other listed order. */
function BookingList({ board, actions, listed }: {
  board: CheckInBoard;
  actions: BoardActions;
  listed: CheckInBooking[];
}) {
  const scanned = findBooking(board.bookings, actions.scannedId);
  const rest = listed.filter(booking => booking.bookingId !== scanned?.bookingId);
  const card = (booking: CheckInBooking, highlighted: boolean) => (
    <CheckInBookingCard key={booking.bookingId} booking={booking} highlighted={highlighted}
      canWrite={board.closedReason === null} busy={actions.busy} canUndo={board.canUndo}
      onCheckIn={ids => void actions.checkIn(ids)} onUndo={id => void actions.undo(id)} />
  );
  return (
    <section className="checkin-list" aria-label="Đơn đã thanh toán của lịch">
      {scanned && (
        <div className="checkin-scanned">
          <div className="checkin-scanned-head">
            <span><Icon name="scan" size={16} />Vé vừa quét</span>
            <button type="button" className="btn btn-ghost btn-small" onClick={actions.clearScan}>Bỏ chọn</button>
          </div>
          {card(scanned, true)}
        </div>
      )}
      {board.bookings.length === 0 && (
        <EmptyState title="Chưa có đơn đã thanh toán cho lịch này">
          <p>Đơn đang giữ chỗ chưa thanh toán không hiện ở đây và không check-in được.</p>
        </EmptyState>
      )}
      {board.bookings.length > 0 && rest.length === 0 && !scanned && <EmptyState title="Không có đơn phù hợp" />}
      {rest.map(booking => card(booking, false))}
    </section>
  );
}

function Feedback({ message, onReload }: { message: CheckInMessage | null; onReload: () => void }) {
  if (!message) return <p className="sr-only" role="status" aria-live="polite" />;
  const success = message.tone === "success";
  return (
    <div className={`checkin-feedback is-${message.tone}`} role={success ? "status" : "alert"}>
      <Icon name={success ? "check" : "alert"} size={18} />
      <div>
        <p>{message.text}</p>
        {!success && (
          <button type="button" className="btn btn-ghost btn-small" onClick={onReload}>Tải lại danh sách</button>
        )}
      </div>
    </div>
  );
}
