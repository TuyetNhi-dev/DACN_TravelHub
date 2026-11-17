import { Icon } from "@/components/ui/Icon";
import { formatCurrency } from "@/lib/format";
import { stayEstimate, stayNights } from "@/lib/hotel-stay";
import type { RoomType, Stay } from "@/types/hotel";

interface RoomTypeCardProps {
  room: RoomType;
  stay: Stay;
  onSelect: (room: RoomType) => void;
}

export function RoomTypeCard({ room, stay, onSelect }: RoomTypeCardProps) {
  const nights = stayNights(stay);
  const estimate = stayEstimate(room, stay);
  return (
    <article className="sh-hotel-room">
      <div>
        <h3>{room.name}</h3>
        <p><Icon name="users" size={16} />Tối đa {room.maxGuests} khách / phòng</p>
        {room.description && <p className="sh-hotel-caption">{room.description}</p>}
        {room.offerTerms && (
          <details>
            <summary>Điều kiện từ đối tác</summary>
            <p>{room.offerTerms}</p>
          </details>
        )}
      </div>
      <div className="sh-hotel-room-price">
        <small>Giá tham khảo / đêm</small>
        <strong>{formatCurrency(room.referencePricePerNight)}</strong>
        {estimate !== null && <p>{formatCurrency(estimate)} cho {nights} đêm × {stay.rooms} phòng</p>}
        {room.referencePricePerNight === null ? (
          <span className="sh-hotel-unavailable">Đối tác chưa có giá</span>
        ) : (
          <button className="btn btn-primary" onClick={() => onSelect(room)}>Chọn phòng</button>
        )}
      </div>
    </article>
  );
}
