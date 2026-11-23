import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { passengerTypeLabel } from "@/lib/admin-departures";
import { formatDate } from "@/lib/format";
import type { ManifestBooking } from "@/types/admin";

// Header cells and the phone card labels (td[data-label]) share these names.
const COLUMNS = ["Mã đơn", "Liên hệ", "Số khách", "Trạng thái", "Hành khách"] as const;
const [CODE, CONTACT, GUESTS, STATUS, PASSENGERS] = COLUMNS;

const bookingHref = (id: string) => `/admin/bookings/${encodeURIComponent(id)}`;

/** One row per order still holding seats (cancelled and failed orders are left out by the server). */
export function ManifestBookings({ bookings }: { bookings: ManifestBooking[] }) {
  return (
    <div className="sh-table-wrap">
      <table className="sh-table sh-table--cards">
        <caption className="sr-only">Các đơn trong danh sách đoàn</caption>
        <thead><tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {bookings.map(booking => (
            <tr key={booking.bookingId}>
              <td data-label={CODE}><Link href={bookingHref(booking.bookingId)}>{booking.code}</Link></td>
              <td data-label={CONTACT}>
                {booking.contactName}
                {booking.contactPhone && (
                  <small><a href={`tel:${booking.contactPhone}`}>{booking.contactPhone}</a></small>
                )}
                <small>{booking.contactEmail}</small>
              </td>
              <td data-label={GUESTS}>
                {booking.adults} người lớn{booking.children > 0 && `, ${booking.children} trẻ em`}
              </td>
              <td data-label={STATUS}><StatusBadge status={booking.status} /></td>
              <td data-label={PASSENGERS}><PassengerList booking={booking} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PassengerList({ booking }: { booking: ManifestBooking }) {
  if (booking.passengers.length === 0) return <small>Chưa nhập tên hành khách</small>;
  return (
    <ol className="adm-passengers">
      {booking.passengers.map((passenger, index) => (
        <li key={index}>
          {passenger.fullName}
          <small>
            {passengerTypeLabel(passenger.type)}
            {passenger.birthDate && ` · sinh ${formatDate(passenger.birthDate)}`}
          </small>
        </li>
      ))}
    </ol>
  );
}
