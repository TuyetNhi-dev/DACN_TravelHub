import { Icon } from "@/components/ui/Icon";

/** Required wording for partner services: a contract price is never a promise of availability. */
export function QuoteNotice({ service }: { service: "hotel" | "flight" }) {
  const subject = service === "hotel" ? "phòng" : "chỗ trên chuyến bay";
  return (
    <div className="sh-notice" role="note">
      <Icon name="shield" size={20} />
      <div>
        <strong>Giá hợp đồng, chờ xác nhận chỗ</strong>
        <p>
          Giá theo hợp đồng của SàiHành với đối tác và giữ nguyên trên đơn. SàiHành gửi yêu cầu tới đối tác
          và chỉ xác nhận đơn khi đối tác báo còn {subject}. Bạn chưa phải thanh toán ở bước này.
        </p>
      </div>
    </div>
  );
}
