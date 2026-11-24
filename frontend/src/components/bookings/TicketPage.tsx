"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useResource } from "@/hooks/useResource";
import { passengerTypeLabel } from "@/lib/admin-departures";
import { ticketStatusLabel } from "@/lib/check-in";
import { weekdayName } from "@/lib/flight-calendar";
import { formatDate } from "@/lib/format";
import { getMyTicket } from "@/services/tickets";
import type { TicketPassenger, TourTicket } from "@/types/ticket";
import { TicketQr } from "./TicketQr";
import "@/styles/ticket.css";

export function TicketPage({ bookingId }: { bookingId: string }) {
  const { session } = useRequireSession();
  const { state, retry } = useResource(session ? `ticket:${bookingId}` : null,
    signal => getMyTicket(bookingId, signal));
  const bookingHref = `/bookings/${encodeURIComponent(bookingId)}`;
  return (
    <main id="main-content" className="container sh-page ticket-page">
      <div className="sh-page-head ticket-no-print">
        <Breadcrumb items={[
          { label: "Đơn của tôi", href: "/bookings" }, { label: "Chi tiết đơn", href: bookingHref },
          { label: "Vé điện tử" },
        ]} />
        <h1>Vé điện tử</h1>
      </div>
      {state.status === "loading" && <LoadingState label="Đang tải vé…" />}
      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={retry} backHref={bookingHref} backLabel="Về chi tiết đơn" />
      )}
      {state.status === "ready" && <TicketCard ticket={state.data} bookingHref={bookingHref} />}
    </main>
  );
}

function TicketCard({ ticket, bookingHref }: { ticket: TourTicket; bookingHref: string }) {
  return (
    <div className="ticket-layout">
      <article className="ticket-card" aria-labelledby="ticket-title">
        <header className="ticket-head">
          <div className="ticket-head-top">
            <span className="ticket-brand"><Icon name="ticket" size={16} />SàiHành · Vé tour</span>
            <span className="ticket-status"><Icon name="check" size={14} />{ticketStatusLabel(ticket.itemStatus)}</span>
          </div>
          <h2 id="ticket-title">{ticket.tourTitle}</h2>
          <p>Mã tour {ticket.tourCode} · Mã đơn <strong>{ticket.bookingCode}</strong></p>
        </header>
        <TicketRoute ticket={ticket} />
        <div className="ticket-perforation" aria-hidden="true" />
        <div className="ticket-stub">
          <TicketQr payload={ticket.qrPayload} code={ticket.ticketCode} />
          <TicketPassengers passengers={ticket.passengers} />
        </div>
        <div className="ticket-actions ticket-no-print">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Icon name="printer" size={18} />In vé
          </button>
          <Link className="btn btn-ghost" href={bookingHref}>Về chi tiết đơn</Link>
        </div>
      </article>
      <TicketGuide />
    </div>
  );
}

function TicketRoute({ ticket }: { ticket: TourTicket }) {
  return (
    <dl className="ticket-route">
      <div>
        <dt>Khởi hành</dt>
        <dd><time dateTime={ticket.departureDate}>{formatDate(ticket.departureDate)}</time></dd>
        <dd className="ticket-route-sub">{weekdayName(ticket.departureDate)} · từ {ticket.departureFrom}</dd>
      </div>
      <span className="ticket-route-line" aria-hidden="true"><Icon name="bus" size={18} /></span>
      <div className="ticket-route-end">
        <dt>Ngày về</dt>
        <dd><time dateTime={ticket.returnDate}>{formatDate(ticket.returnDate)}</time></dd>
        <dd className="ticket-route-sub">{weekdayName(ticket.returnDate)}</dd>
      </div>
    </dl>
  );
}

function TicketPassengers({ passengers }: { passengers: TicketPassenger[] }) {
  return (
    <section className="ticket-passengers-block" aria-labelledby="ticket-passengers">
      <h3 id="ticket-passengers"><Icon name="users" size={18} />Hành khách <span>({passengers.length})</span></h3>
      <ol className="ticket-passengers">
        {passengers.map((passenger, index) => (
          <li key={`${passenger.fullName}-${index}`}>
            <span className="ticket-passenger-index" aria-hidden="true">{index + 1}</span>
            <span className="ticket-passenger-name">
              {passenger.fullName}<small>{passengerTypeLabel(passenger.type)}</small>
            </span>
            {passenger.checkedIn && (
              <span className="ticket-boarded"><Icon name="check" size={14} />Đã check-in</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** What to do with the ticket; kept generic on purpose: the meeting time and place are in the tour itinerary. */
function TicketGuide() {
  return (
    <aside className="ticket-guide ticket-no-print" aria-labelledby="ticket-guide-title">
      <h2 id="ticket-guide-title">Dùng vé thế nào?</h2>
      <ol>
        <li>Mang vé theo: bản in, ảnh mã QR đã tải, hoặc mở trang này trên điện thoại.</li>
        <li>Có mặt ở điểm tập trung theo lịch trình tour.</li>
        <li>Đưa mã QR cho hướng dẫn viên quét. Không quét được thì đọc mã đơn để check-in theo danh sách.</li>
      </ol>
      <p className="ticket-guide-warn">
        <Icon name="shield" size={16} />
        <span>Mã QR không chứa thông tin cá nhân, nhưng ai có ảnh vé cũng dùng được: đừng đăng ảnh vé lên mạng.</span>
      </p>
    </aside>
  );
}
