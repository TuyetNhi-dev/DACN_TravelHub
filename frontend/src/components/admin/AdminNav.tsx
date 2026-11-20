"use client";

import Link from "next/link";
import { useResource } from "@/hooks/useResource";
import { getNewServiceRequestCount } from "@/services/admin-service-requests";

const MAX_SHOWN = 99;

interface AdminNavProps {
  current: "bookings" | "requests";
  /** Changing it reloads the "new" count, e.g. after a request's status was updated. */
  refreshKey?: string;
}

/** Switches between the two back-office queues; the badge counts requests nobody has contacted yet. */
export function AdminNav({ current, refreshKey = "" }: AdminNavProps) {
  const { state } = useResource(`admin:new-requests:${refreshKey}`, getNewServiceRequestCount);
  // The badge is a hint: if the count cannot be loaded the link still works, so errors stay silent.
  const count = state.status === "ready" ? state.data : 0;
  return (
    <nav className="admin-nav" aria-label="Khu quản trị">
      <Link href="/admin/bookings" aria-current={current === "bookings" ? "page" : undefined}>Đơn đặt chỗ</Link>
      <Link href="/admin/service-requests" aria-current={current === "requests" ? "page" : undefined}>
        Yêu cầu dịch vụ
        {count > 0 && (
          <span className="admin-nav-badge">
            <span aria-hidden="true">{count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}</span>
            <span className="sr-only">, {count} yêu cầu mới</span>
          </span>
        )}
      </Link>
    </nav>
  );
}
