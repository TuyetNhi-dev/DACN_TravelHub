"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthFormSubmit, type AuthMode } from "@/hooks/useAuthFormSubmit";
import { PasswordField, TextField } from "./AuthFields";
import { GoogleButton } from "./GoogleButton";
import { OtpStep } from "./OtpStep";

interface FormCopy {
  title: string;
  intro: string;
  submit: string;
  switchText: string;
  switchLink: string;
  switchHref: string;
}

const COPY: Record<AuthMode, FormCopy> = {
  login: {
    title: "Đăng nhập", intro: "Chào bạn trở lại. Hành trình mới đang chờ!", submit: "Đăng nhập",
    switchText: "Chưa có tài khoản? ", switchLink: "Đăng ký ngay", switchHref: "/register",
  },
  register: {
    title: "Đăng ký", intro: "Tạo tài khoản để đặt chỗ và theo dõi đơn của bạn.", submit: "Gửi mã OTP",
    switchText: "Đã có tài khoản? ", switchLink: "Đăng nhập", switchHref: "/login",
  },
};

const SESSION_EXPIRED = "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.";

export function AuthForm({ mode, sessionExpired = false }: { mode: AuthMode; sessionExpired?: boolean }) {
  const { busy, error, pending, submit, reset } = useAuthFormSubmit(mode);
  return (
    <main id="main-content" className={`auth-page auth-stage${mode === "register" ? " auth-stage-register" : ""}`}>
      <section className="auth-card auth-form-card" aria-labelledby="auth-title">
        <Link href="/" className="auth-close" aria-label="Đóng và về trang chủ"><Icon name="close" /></Link>
        <div className="auth-brand"><Logo /></div>
        {pending
          ? <OtpStep {...pending} onChangeEmail={mode === "register" ? reset : undefined} />
          : <CredentialsForm mode={mode} busy={busy} error={error} onSubmit={submit}
              notice={sessionExpired && mode === "login" ? SESSION_EXPIRED : ""} />}
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
  const copy = COPY[mode];
  return (
    <>
      <div className="auth-intro">
        <h1 id="auth-title">{copy.title}</h1>
        <p>{copy.intro}</p>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={onSubmit}>
        {isRegister && <RegisterOnlyFields />}
        <TextField name="email" label="Email" type="email" autoComplete="email" placeholder="ban@email.com"
          maxLength={254} />
        <div className={isRegister ? "auth-password-grid" : "auth-password-single"}>
          <PasswordField name="password" label="Mật khẩu" isNew={isRegister} />
          {isRegister && <PasswordField name="confirmPassword" label="Xác nhận" isNew />}
        </div>
        {isRegister && <TermsCheckbox />}
        <Button type="submit" className="auth-submit" loading={busy}>{copy.submit}</Button>
      </form>
      <p className="auth-switch">{copy.switchText}<Link href={copy.switchHref}>{copy.switchLink}</Link></p>
      <GoogleButton text={isRegister ? "signup_with" : "continue_with"} />
    </>
  );
}

function RegisterOnlyFields() {
  return (
    <TextField name="fullName" label="Họ và tên" autoComplete="name" placeholder="Nguyễn Văn An"
      minLength={2} maxLength={160} />
  );
}

function TermsCheckbox() {
  return (
    <label className="auth-terms">
      <input type="checkbox" name="acceptTerms" required />
      <span>
        Tôi đồng ý với <Link href="/terms" target="_blank">Điều khoản sử dụng</Link> và{" "}
        <Link href="/privacy" target="_blank">Chính sách bảo mật</Link> của SàiHành
      </span>
    </label>
  );
}
