"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest, safeReturnPath } from "@/lib/auth";
import { useAuth } from "./AuthProvider";
import { Logo } from "@/components/layout/Logo";
import { Icon } from "@/components/ui/Icon";

function PasswordField({ name, label, register }: { name: string; label: string; register: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field"><label htmlFor={name}>{label} <span aria-hidden="true">*</span></label>
    <div className="auth-password"><input id={name} name={name} type={visible ? "text" : "password"}
      autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 12 : undefined} maxLength={128}
      placeholder={register ? name === "confirmPassword" ? "Nhập lại mật khẩu" : "Tối thiểu 12 ký tự" : "Nhập mật khẩu"} />
      <button type="button" aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`} aria-pressed={visible}
        onClick={() => setVisible(!visible)}><Icon name={visible ? "eyeOff" : "eye"} /></button>
    </div>
  </div>;
}

export function AuthForm({ mode, sessionExpired = false }: { mode: "login" | "register"; sessionExpired?: boolean }) {
  const register = mode === "register";
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return <main id="main-content" className={`auth-page auth-stage${register ? " auth-stage-register" : ""}`}>
    <div className="auth-backdrop-copy" aria-hidden="true"><span>SÀIHÀNH</span><p>Đi để cảm<br />nhiều hơn.</p><span>MỖI CHUYẾN ĐI, MỘT CÂU CHUYỆN.</span></div>
    <section className="auth-card auth-form-card" aria-labelledby="auth-title">
    <Link href="/" className="auth-close" aria-label="Đóng và về trang chủ"><Icon name="close" /></Link>
    <div className="auth-brand"><Logo /></div>
    <div className="auth-intro"><span className="auth-eyebrow">HÀNH TRÌNH CỦA RIÊNG BẠN</span>
    <h1 id="auth-title">{register ? "Đăng ký" : "Đăng nhập"}</h1>
    <p>{register ? "Một tài khoản nhỏ. Mở ra những hành trình lớn." : "Chào bạn trở lại. Hành trình mới đang chờ!"}</p></div>
    {sessionExpired && !register && <p role="status">Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {success && <p className="auth-success" role="status">{success}</p>}
    {register && success ? <Link className="btn btn-primary" href="/login">Đến trang đăng nhập</Link> : <form onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      const form = event.currentTarget;
      const data = new FormData(form);
      const values = Object.fromEntries(data) as Record<string, string>;
      setError(""); setSuccess("");
      if (register && values.password !== values.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
      setBusy(true);
      try {
        await authRequest(mode, values);
        if (register) { form.reset(); setSuccess("Đăng ký thành công. Bạn có thể đăng nhập ngay."); }
        else { await refresh(true); setSuccess("Đăng nhập thành công."); router.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next"))); router.refresh(); }
      } catch (error) { setError(error instanceof Error ? error.message : "Không thể kết nối. Vui lòng thử lại."); }
      finally { setBusy(false); }
    }}>
      {register && <div className="auth-field"><label htmlFor="fullName">Họ và tên <span aria-hidden="true">*</span></label><input id="fullName" name="fullName" autoComplete="name" placeholder="Nguyễn Văn An" required minLength={2} maxLength={160} /></div>}
      {register && <div className="auth-field"><label htmlFor="phone">Số điện thoại <span aria-hidden="true">*</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="090…" required pattern="\+?[0-9]{9,15}" maxLength={16} title="9–15 chữ số, có thể bắt đầu bằng +" /></div>}
      <div className="auth-field"><label htmlFor="email">Email <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" autoComplete="email" placeholder="ban@email.com" required maxLength={254} /></div>
      <div className={register ? "auth-password-grid" : "auth-password-single"}>
        <PasswordField name="password" label="Mật khẩu" register={register} />
        {register && <PasswordField name="confirmPassword" label="Xác nhận mật khẩu" register />}
      </div>
      {register && <small className="auth-password-hint">Dùng 12–128 ký tự để bảo vệ hành trình của bạn.</small>}
      <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : register ? "Tạo tài khoản SàiHành" : "Đăng nhập"}{!busy && <Icon name="arrow" size={18} />}</button>
    </form>}
    <p className="auth-switch">{register ? "Đã có tài khoản? " : "Chưa có tài khoản? "}<Link href={register ? "/login" : "/register"}>{register ? "Đăng nhập" : "Đăng ký ngay"}</Link></p>
    <div className="auth-card-footer"><Icon name="shield" size={16} /><span>Thông tin của bạn được bảo vệ</span></div>
  </section></main>;
}
