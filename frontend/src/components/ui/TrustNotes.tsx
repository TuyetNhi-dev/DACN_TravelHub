import { Icon, type IconName } from "./Icon";

interface TrustNote {
  icon: IconName;
  title: string;
  text: string;
}

/** Only what the booking system enforces (see AGENTS.md: tour hold, simulated payment, cancellation). */
const NOTES: TrustNote[] = [
  { icon: "clock", title: "Giữ chỗ 10 phút",
    text: "Khi đặt, chỗ được trừ ngay và giữ cho bạn trong 10 phút để thanh toán." },
  { icon: "lock", title: "Thanh toán an toàn",
    text: "Bản đồ án dùng thanh toán mô phỏng: không trừ tiền thật, không nhập thông tin thẻ." },
  { icon: "shield", title: "Hủy khi chưa xác nhận",
    text: "Bạn tự hủy được đơn chưa xác nhận trước ngày khởi hành, chỗ được trả lại ngay." },
];

/** Reassurance block for the cart and payment pages. */
export function TrustNotes({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`ui-trust${compact ? " ui-trust--compact" : ""}`} aria-label="Cam kết khi đặt tour">
      {NOTES.map(note => (
        <li key={note.title}>
          <span className="ui-trust-icon" aria-hidden="true"><Icon name={note.icon} size={18} /></span>
          <span><b>{note.title}</b><small>{note.text}</small></span>
        </li>
      ))}
    </ul>
  );
}
