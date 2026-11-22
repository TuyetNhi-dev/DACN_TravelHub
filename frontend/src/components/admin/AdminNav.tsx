"use client";

import Link from "next/link";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";
import { NewRequestBadge } from "./NewRequestBadge";

interface AdminNavProps {
  current: "bookings" | "requests";
}

/** Switches between the two back-office queues; the badge counts requests nobody has contacted yet. */
export function AdminNav({ current }: AdminNavProps) {
  // Same count as the header badge (NewRequestCountProvider), so the page does not load it twice.
  const { count } = useNewRequestCount();
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
