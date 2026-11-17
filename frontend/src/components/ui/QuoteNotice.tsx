import { Icon } from "@/components/ui/Icon";

/** Required wording for partner services: a reference price is never a promise of availability. */
export function QuoteNotice({ service }: { service: "hotel" | "flight" }) {
  const subject = service === "hotel" ? "phòng" : "chỗ trên chuyến bay";
  return (
    <div className="sh-notice" role="note">
      <Icon name="shield" size={20} />
      <div>
        <strong>Giá tham khảo, chờ xác nhận</strong>
        <p>
          Giá do đối tác cung cấp và có thể thay đổi. SàiHành gửi yêu cầu tới đối tác và chỉ xác nhận đơn
          khi đối tác báo còn {subject}. Bạn chưa phải thanh toán ở bước này.
        </p>
      </div>
    </div>
  );
}
