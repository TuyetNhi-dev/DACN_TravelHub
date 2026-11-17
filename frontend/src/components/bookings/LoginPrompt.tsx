"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginHref } from "@/lib/auth";

/** Orders belong to an account, so anonymous visitors are asked to sign in before booking. */
export function LoginPrompt({ action }: { action: string }) {
  const pathname = usePathname();
  const returnPath = typeof window === "undefined" ? pathname : pathname + window.location.search;
  return (
    <div className="sh-state">
      <h3>Đăng nhập để {action}</h3>
      <p>Đơn đặt chỗ được lưu vào tài khoản để bạn theo dõi trạng thái và nhận xác nhận.</p>
      <div className="sh-state-actions">
        <Link className="btn btn-primary" href={loginHref(returnPath)}>Đăng nhập</Link>
        <Link className="btn btn-outline" href="/register">Tạo tài khoản</Link>
      </div>
    </div>
  );
}
