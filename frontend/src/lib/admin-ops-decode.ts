/** Runtime decoders for order follow-up and audit actors (see lib/decode.ts for why every response is checked). */
import { list, num, optStr, str, type Row } from "@/lib/decode";
import type { AuditActor, BookingActivity } from "@/types/admin-ops";

const R = "quản trị";

export function decodeBookingActivity(row: Row): BookingActivity {
  return {
    payments: list(row.payments, p => ({
      id: str(p, "id", R), provider: str(p, "provider", R), amount: num(p, "amount", R), status: str(p, "status", R),
      paidAt: optStr(p, "paidAt", R), createdAt: str(p, "createdAt", R),
    }), R),
    history: list(row.history, h => ({
      at: str(h, "at", R), actorName: str(h, "actorName", R), action: str(h, "action", R),
      summary: str(h, "summary", R),
    }), R),
    notes: list(row.notes, n => ({
      id: str(n, "id", R), authorName: str(n, "authorName", R), text: str(n, "text", R),
      createdAt: str(n, "createdAt", R),
    }), R),
  };
}

export const decodeAuditActor = (row: Row): AuditActor => ({ id: str(row, "id", R), fullName: str(row, "fullName", R) });
