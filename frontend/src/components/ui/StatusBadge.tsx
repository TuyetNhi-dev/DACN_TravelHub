import { itemStatusMeta } from "@/lib/booking-rules";
import { Badge } from "./Badge";

export function StatusBadge({ status }: { status: string }) {
  const meta = itemStatusMeta(status);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
