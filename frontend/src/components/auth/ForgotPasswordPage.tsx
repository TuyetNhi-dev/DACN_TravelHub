"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { requestPasswordReset } from "@/services/auth";
import { TextField } from "./AuthFields";
import { OtpInput } from "./OtpInput";
import { PasswordPair } from "./PasswordPair";
import { ResendVerification } from "./ResendVerification";

export function ForgotPasswordPage() {
  const flow = useForgotPassword();
  const { step } = flow;
  return (
    <main id="main-content" className="auth-page auth-stage">
      <section className="auth-card auth-form-card" aria-labelledby="auth-title">
        <Link href="/login" className="auth-close" aria-label="Đóng và về trang đăng nhập"><Icon name="close" /></Link>
        <div className="auth-brand"><Logo /></div>
        <div className="auth-intro">
          <h1 id="auth-title">Quên mật khẩu</h1>
          <p>{step.kind === "email"
            ? "Nhập email đã đăng ký, chúng tôi sẽ gửi mã 6 số để bạn đặt mật khẩu mới."
            : "Nhập mã trong email và mật khẩu mới của bạn."}</p>
        </div>
        {flow.error && <p className="auth-error" role="alert">{flow.error}</p>}
        {step.kind === "email" ? (
          <form onSubmit={flow.requestCode}>
            <TextField name="email" label="Email" type="email" autoComplete="email" placeholder="ban@email.com"
              maxLength={254} />
            <Button type="submit" className="auth-submit" loading={flow.busy}>Gửi mã đặt lại</Button>
          </form>
        ) : (
          <form onSubmit={flow.resetPassword}>
            <p className="auth-notice" role="status">{step.message}</p>
            <p className="otp-step-email">Email: <b>{step.email}</b></p>
            <fieldset className="auth-otp-field">
              <legend>Mã gồm 6 chữ số</legend>
              <OtpInput value={flow.code} onChange={flow.setCode} disabled={flow.busy} />
            </fieldset>
            <PasswordPair name="newPassword" label="Mật khẩu mới" />
            <Button type="submit" className="auth-submit" loading={flow.busy}>Đặt mật khẩu mới</Button>
            <p className="otp-step-hint">Mã có hiệu lực 10 phút. Không thấy thư? Hãy xem mục Spam.</p>
            <ResendVerification email={step.email} startCoolingDown send={requestPasswordReset} />
            <button type="button" className="auth-link-button" onClick={flow.changeEmail}>Nhập email khác</button>
          </form>
        )}
        <p className="auth-back"><Link href="/login">← Quay lại đăng nhập</Link></p>
      </section>
    </main>
  );
}
