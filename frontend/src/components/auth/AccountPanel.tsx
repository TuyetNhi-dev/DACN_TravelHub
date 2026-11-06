"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { AuthActions } from "./AuthActions";
export function AccountPanel() {
  const { session, loading, error, refresh } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !session && !error) router.replace("/login?next=/account&expired=1"); }, [loading, session, error, router]);
  if (error) return <main id="main-content" className="container auth-page"><section className="auth-card"><p role="alert">{error}</p><button className="btn btn-primary" onClick={() => void refresh()}>Thử lại</button></section></main>;
  if (loading || !session) return <main id="main-content" className="container auth-page"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>;
  const user = session.user;
  return <main id="main-content" className="container auth-page"><section className="auth-card"><h1>Tài khoản của bạn</h1>
    <dl><dt>Họ tên</dt><dd>{user.fullName}</dd><dt>Email</dt><dd>{user.email}</dd><dt>Điện thoại</dt><dd>{user.phone || "Chưa cập nhật"}</dd>
      <dt>Vai trò</dt><dd>{user.roles.map(role => role.code === "CUSTOMER" ? "Khách hàng" : `${role.code} (${role.scope})`).join(", ") || "Chưa được phân quyền"}</dd></dl>
    <AuthActions />
  </section></main>;
}
