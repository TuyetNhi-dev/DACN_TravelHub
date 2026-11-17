import { Icon, type IconName } from "@/components/ui/Icon";
import { policyLabel } from "@/lib/hotel-amenities";
import type { HouseRules } from "@/types/hotel";

const POLICY_ICONS: Record<string, IconName> = {
  cancellation: "calendar", children: "users", extra_bed: "bed", payment: "wallet", deposit: "wallet",
  pets: "heart", smoking: "close",
};

export function HotelHouseRules({ rules }: { rules: HouseRules }) {
  if (!rules.checkInFrom && !rules.checkOutUntil && rules.policies.length === 0) return null;
  return (
    <section id="hotel-rules" className="sh-hotel-panel" aria-labelledby="rules-title">
      <h2 id="rules-title">Chính sách lưu trú</h2>
      <dl className="hotel-rules">
        {rules.checkInFrom && (
          <Rule icon="clock" label="Nhận phòng">Từ {rules.checkInFrom}. Mang theo CCCD hoặc hộ chiếu.</Rule>
        )}
        {rules.checkOutUntil && <Rule icon="clock" label="Trả phòng">Trước {rules.checkOutUntil}.</Rule>}
        {rules.policies.map(policy => (
          <Rule key={policy.type} icon={POLICY_ICONS[policy.type] ?? "check"} label={policyLabel(policy.type)}>
            {policy.content}
          </Rule>
        ))}
      </dl>
      <p className="sh-hotel-caption">
        Chính sách do đối tác cung cấp và có thể thay đổi; SàiHành xác nhận lại khi bạn đặt phòng.
      </p>
    </section>
  );
}

function Rule({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt><Icon name={icon} size={18} />{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
