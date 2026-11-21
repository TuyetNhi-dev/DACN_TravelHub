"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthFormSubmit, type AuthMode } from "@/hooks/useAuthFormSubmit";
import { VIETNAMESE_PHONE_HINT } from "@/lib/phone-vn";
import { PasswordField, TextField } from "./AuthFields";
import { GoogleButton } from "./GoogleButton";
import { OtpStep } from "./OtpStep";
import { PasswordPair } from "./PasswordPair";
import { TermsConsent } from "./TermsConsent";

export const FORGOT_PASSWORD_PATH = "/quen-mat-khau";

const COPY: Record<AuthMode, { title: string; intro: string }> = {
  login: { title: "Đăng nhập", intro: "Chào bạn trở lại. Hành trình mới đang chờ!" },
  register: { title: "Đăng ký", intro: "Tạo tài khoản để đặt chỗ và theo dõi đơn của bạn." },
};

/** `notice` is a status line above the form, e.g. after a password reset or an expired session. */
export function AuthForm({ mode, notice = "" }: { mode: AuthMode; notice?: string }) {
  const { busy, error, pending, submit, reset } = useAuthFormSubmit(mode);
  return (
    <main id="main-content" className={`auth-page auth-stage${mode === "register" ? " auth-stage-register" : ""}`}>
      <section className="auth-card auth-form-card" aria-labelledby="auth-title">
        <Link href="/" className="auth-close" aria-label="Đóng và về trang chủ"><Icon name="close" /></Link>
        <div className="auth-brand"><Logo /></div>
        {pending
          ? <OtpStep {...pending} onChangeEmail={mode === "register" ? reset : undefined} />
          : <CredentialsForm mode={mode} busy={busy} error={error} onSubmit={submit} notice={notice} />}
      </section>
    </main>
  );
}

interface CredentialsFormProps {
  mode: AuthMode;
  busy: boolean;
  error: string;
  notice: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function CredentialsForm({ mode, busy, error, notice, onSubmit }: CredentialsFormProps) {
  const isRegister = mode === "register";
  return (
    <>
      <div className="auth-intro">
        <h1 id="auth-title">{COPY[mode].title}</h1>
        <p>{COPY[mode].intro}</p>
      </div>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={onSubmit}>
        {isRegister ? <RegisterFields /> : <LoginFields />}
        {isRegister
          ? <Button type="submit" className="auth-submit" loading={busy}>Gửi mã OTP</Button>
          : (
            <div className="auth-actions">
              <Link className="btn btn-outline auth-actions-secondary" href="/register">Đăng ký ngay</Link>
              <Button type="submit" className="auth-submit" loading={busy}>Đăng nhập</Button>
            </div>
          )}
      </form>
      {isRegister && (
        <div className="auth-switch">
          <span>Đã có tài khoản?</span>
          <Link className="btn btn-outline auth-switch-btn" href="/login">Đăng nhập</Link>
        </div>
      )}
      <GoogleButton text={isRegister ? "signup_with" : "continue_with"} />
    </>
  );
}

function LoginFields() {
  return (
    <>
      <TextField name="email" label="Email" type="email" autoComplete="email" placeholder="ban@email.com"
        maxLength={254} />
      <div className="auth-password-single">
        <PasswordField name="password" label="Mật khẩu" isNew={false}
          aside={<Link className="auth-forgot" href={FORGOT_PASSWORD_PATH}>Quên mật khẩu?</Link>} />
      </div>
    </>
  );
}

function RegisterFields() {
  return (
    <>
      <TextField name="fullName" label="Họ và tên" autoComplete="name" placeholder="Nguyễn Văn An"
        minLength={2} maxLength={160} />
      <TextField name="email" label="Email" type="email" autoComplete="email" placeholder="ban@email.com"
        maxLength={254} />
      <TextField name="phone" label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" required={false}
        placeholder="0912 345 678" maxLength={20}
        hint={`Dùng để điền sẵn thông tin liên hệ khi đặt tour. ${VIETNAMESE_PHONE_HINT}.`} />
      <PasswordPair name="password" label="Mật khẩu" />
      <TermsConsent name="acceptTerms" />
    </>
  );
}
