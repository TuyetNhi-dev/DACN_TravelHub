"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useOtpVerification } from "@/hooks/useOtpVerification";
import { OTP_LENGTH, OtpInput } from "./OtpInput";
import { ResendVerification } from "./ResendVerification";

interface OtpStepProps {
  email: string;
  message: string;
  /** True right after a code was mailed, so resending starts on cooldown. */
  emailSent: boolean;
  onChangeEmail?: () => void;
}

/** Second step of sign-up (or of signing in to an unverified account): enter the 6-digit emailed code. */
export function OtpStep({ email, message, emailSent, onChangeEmail }: OtpStepProps) {
  const { code, busy, error, change, verify } = useOtpVerification(email);
  return (
    <div className="otp-step">
      <span className="otp-step-icon" aria-hidden="true"><Icon name="shield" size={26} /></span>
      <h2>Nhập mã xác nhận</h2>
      <p role="status">{message}</p>
      <p className="otp-step-email">Gửi tới <b>{email}</b></p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={event => { event.preventDefault(); void verify(); }}>
        <OtpInput value={code} onChange={change} disabled={busy} invalid={Boolean(error)} />
        <Button type="submit" className="auth-submit" loading={busy} loadingLabel="Đang xác nhận…"
          disabled={code.length !== OTP_LENGTH}>
          Xác nhận
        </Button>
      </form>
      <p className="otp-step-hint">Mã có hiệu lực 10 phút. Không thấy thư? Hãy xem mục Spam.</p>
      <ResendVerification email={email} startCoolingDown={emailSent} />
      {onChangeEmail && (
        <button type="button" className="auth-link-button" onClick={onChangeEmail}>Đổi email đăng ký</button>
      )}
    </div>
  );
}
