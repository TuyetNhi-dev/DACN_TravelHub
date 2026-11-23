import { Badge } from "@/components/ui/Badge";
import { TOUR_STATUS } from "@/lib/admin-labels";
import type { TourStatus } from "@/types/admin";

export function TourStatusBadge({ status }: { status: TourStatus }) {
  const meta = TOUR_STATUS[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
