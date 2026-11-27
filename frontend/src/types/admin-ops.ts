/** Order follow-up and audit filters of the back office (mirrors Features/Admin/Bookings and Audit DTOs). */

export interface BookingPayment {
  id: string;
  provider: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

/** One line of "Lịch sử": the order's creation, then each back-office change. */
export interface BookingHistoryEntry {
  at: string;
  actorName: string;
  action: string;
  summary: string;
}

/** Internal note: staff only, never shown to the customer. */
export interface BookingNote {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface BookingActivity {
  payments: BookingPayment[];
  history: BookingHistoryEntry[];
  notes: BookingNote[];
}

export interface AuditActor {
  id: string;
  fullName: string;
}
