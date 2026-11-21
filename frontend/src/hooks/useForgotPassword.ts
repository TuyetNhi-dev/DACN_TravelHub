"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { OTP_LENGTH } from "@/components/auth/OtpInput";
import { ApiError } from "@/lib/api-client";
import { confirmPasswordReset, requestPasswordReset } from "@/services/auth";

/** Login page shows "Đã đặt mật khẩu mới thành công" when it gets this query. */
export const RESET_DONE_PATH = "/login?reset=1";

type Step = { kind: "email" } | { kind: "code"; email: string; message: string };

const failureText = (failure: unknown) =>
  failure instanceof ApiError ? failure.message : "Không thể kết nối. Vui lòng thử lại.";

/** "Quên mật khẩu": email → 6-digit code + new password → back to the login page. */
export function useForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(false);
    }
  }

  function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    void run(async () => setStep({ kind: "code", email, message: await requestPasswordReset(email) }));
  }

  function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind !== "code") return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (code.length !== OTP_LENGTH) { setError("Vui lòng nhập đủ mã gồm 6 chữ số."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    void run(async () => {
      await confirmPasswordReset({ email: step.email, code, newPassword, confirmPassword });
      router.replace(RESET_DONE_PATH);
    });
  }

  function changeEmail() {
    setStep({ kind: "email" });
    setCode("");
    setError("");
  }

  return { step, code, setCode, busy, error, requestCode, resetPassword, changeEmail };
}
