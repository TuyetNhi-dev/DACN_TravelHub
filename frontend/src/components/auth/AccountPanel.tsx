"use client";

import Link from "next/link";
import { ContactPhoneField } from "@/components/bookings/ContactPhoneField";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { ApiError } from "@/lib/api-client";
import { isOperator, roleLabel } from "@/lib/auth";
import { AuthActions } from "./AuthActions";

export function AccountPanel() {
  const { session, loading, error, refresh } = useRequireSession();
  return (
    <main id="main-content" className="container auth-page">
      {error && <ErrorState error={new ApiError(error)} onRetry={() => void refresh()} />}
      {!error && (loading || !session) && <LoadingState label="Đang kiểm tra phiên đăng nhập…" />}
      {!error && session && (
        <section className="auth-card">
          <h1>Tài khoản của bạn</h1>
          <dl>
            <dt>Họ tên</dt><dd>{session.user.fullName}</dd>
            <dt>Email</dt><dd>{session.user.email}</dd>
            <dt>Điện thoại</dt>
            <dd><ContactPhoneField key={session.user.phone ?? "none"} phone={session.user.phone} /></dd>
            <dt>Vai trò</dt>
            <dd>{session.user.roles.map(role => roleLabel(role.code)).join(", ") || "Chưa được phân quyền"}</dd>
          </dl>
          <div className="sh-actions">
            <Link className="btn btn-primary" href="/bookings">Đơn của tôi</Link>
            {isOperator(session.user) && <Link className="btn btn-outline" href="/admin/bookings">Quản trị đơn</Link>}
            {isOperator(session.user) && (
              <Link className="btn btn-outline" href="/admin/service-requests">Yêu cầu tư vấn</Link>
            )}
            <AuthActions />
          </div>
        </section>
      )}
    </main>
  );
}
