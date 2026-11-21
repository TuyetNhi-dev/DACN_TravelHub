"use client";

import Link from "next/link";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";
import { NewRequestBadge } from "./NewRequestBadge";

interface AdminNavProps {
  current: "bookings" | "requests";
  /** Changing it reloads the "new" count, e.g. after a request's status was updated. */
  refreshKey?: string;
}

/** Switches between the two back-office queues; the badge counts requests nobody has contacted yet. */
export function AdminNav({ current, refreshKey = "" }: AdminNavProps) {
  // Admin pages sit behind OperatorGate, so the viewer is staff or an admin.
  const count = useNewRequestCount(true, refreshKey);
  return (
    <nav className="admin-nav" aria-label="Khu quản trị">
      <Link href="/admin/bookings" aria-current={current === "bookings" ? "page" : undefined}>Đơn đặt chỗ</Link>
      <Link href="/admin/service-requests" aria-current={current === "requests" ? "page" : undefined}>
        Yêu cầu dịch vụ
        <NewRequestBadge count={count} />
      </Link>
    </nav>
  );
}
