"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "./AuthFields";
import { OtpStep } from "./OtpStep";

/** For users who closed the sign-up form: enter the email, then the 6-digit code from the mail. */
export function VerifyEmailPanel() {
  const [email, setEmail] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("email");
    if (typeof value === "string" && value.trim()) setEmail(value.trim());
  }

  return (
    <main id="main-content" className="auth-page auth-stage">
      <section className="auth-card auth-form-card" aria-labelledby="verify-title">
        <Link href="/" className="auth-close" aria-label="Đóng và về trang chủ"><Icon name="close" /></Link>
        <div className="auth-brand"><Logo /></div>
        {email ? (
          <OtpStep email={email} emailSent={false} onChangeEmail={() => setEmail(null)}
            message="Nhập mã 6 số trong email SàiHành đã gửi. Nếu mã đã hết hạn, hãy bấm gửi lại mã." />
        ) : (
          <>
            <div className="auth-intro">
              <h1 id="verify-title">Xác nhận email</h1>
              <p>Nhập email bạn đã dùng để đăng ký tài khoản.</p>
            </div>
            <form onSubmit={submit}>
              <TextField name="email" label="Email" type="email" autoComplete="email" placeholder="ban@email.com"
                maxLength={254} />
              <Button type="submit" className="auth-submit">Tiếp tục</Button>
            </form>
            <p className="auth-switch">Đã xác nhận? <Link href="/login">Đăng nhập</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
