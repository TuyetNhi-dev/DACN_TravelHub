"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionMessage, type SectionMessageValue } from "@/components/admin/tours/SectionMessage";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api-client";
import { manifestHref, seatSummary, statusToggleFor, type StatusToggle } from "@/lib/admin-departures";
import { DEPARTURE_STATUS } from "@/lib/admin-labels";
import { tourEditHref } from "@/lib/admin-tours";
import { formatCurrency, formatDate, vietnamToday } from "@/lib/format";
import { setDepartureStatus } from "@/services/admin-catalog";
import type { AdminDeparture } from "@/types/admin";

interface TableProps {
  departures: AdminDeparture[];
  onEdit: (departure: AdminDeparture) => void;
  onChanged: (departure: AdminDeparture) => void;
}

// Header cells and the phone card labels (td[data-label]) share these names.
const COLUMNS = ["Ngày đi – về", "Tour", "Khởi hành từ", "Chỗ", "Giá", "Trạng thái", "Thao tác"] as const;
const [DATES, TOUR, FROM, SEATS, PRICE, STATUS, ACTIONS] = COLUMNS;

export function DepartureTable({ departures, onEdit, onChanged }: TableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<SectionMessageValue>(null);
  const today = vietnamToday();

  async function toggle(departure: AdminDeparture, action: StatusToggle) {
    setBusyId(departure.id);
    setMessage(null);
    try {
      onChanged(await setDepartureStatus(departure.id, action.status));
      setMessage({ kind: "success", text: `${action.label} lịch ${formatDate(departure.departureDate)}.` });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setMessage({ kind: "error", text: error.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SectionMessage message={message} />
      <div className="sh-table-wrap">
        <table className="sh-table sh-table--cards">
          <caption className="sr-only">Danh sách lịch khởi hành</caption>
          <thead><tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {departures.map(departure => (
              <DepartureRow key={departure.id} departure={departure} toggle={statusToggleFor(departure, today)}
                busy={busyId === departure.id} onEdit={onEdit} onToggle={action => void toggle(departure, action)} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface RowProps {
  departure: AdminDeparture;
  toggle: StatusToggle | null;
  busy: boolean;
  onEdit: (departure: AdminDeparture) => void;
  onToggle: (action: StatusToggle) => void;
}

function DepartureRow({ departure, toggle, busy, onEdit, onToggle }: RowProps) {
  const seats = seatSummary(departure);
  const status = DEPARTURE_STATUS[departure.status];
  return (
    <tr>
      <td data-label={DATES}>
        {formatDate(departure.departureDate)}<small>về {formatDate(departure.returnDate)}</small>
      </td>
      <td data-label={TOUR}>
        <Link href={tourEditHref(departure.tourId)}>{departure.tourCode}</Link>
        <small>{departure.tourTitle}</small>
      </td>
      <td data-label={FROM}>{departure.departureFrom}<small>{departure.branchName}</small></td>
      <td data-label={SEATS}>
        {seats.text}
        {seats.belowMinimum && <small className="adm-warn">Chưa đủ {departure.minGuests} khách tối thiểu</small>}
      </td>
      <td data-label={PRICE}>
        {formatCurrency(departure.adultPrice)}
        <small>Trẻ em: {formatCurrency(departure.childPrice ?? departure.adultPrice)}</small>
      </td>
      <td data-label={STATUS}><Badge tone={status.tone}>{status.label}</Badge></td>
      <td data-label={ACTIONS}>
        <div className="adm-actions">
          <Link className="btn btn-ghost btn-small" href={manifestHref(departure.id)}>Danh sách đoàn</Link>
          {departure.canEdit && (
            <button type="button" className="btn btn-outline btn-small" onClick={() => onEdit(departure)}>Sửa</button>
          )}
          {departure.canEdit && toggle && (
            <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => onToggle(toggle)}>
              {busy ? "Đang lưu…" : toggle.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
