"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { safeReturnPath } from "@/lib/auth";
import { normalizeVietnamesePhone } from "@/lib/phone-vn";
import { login, register } from "@/services/auth";
import { EMAIL_NOT_VERIFIED } from "@/types/auth";

export type AuthMode = "login" | "register";

/** Set when the user must open the verification email before signing in. */
export interface PendingVerification {
  email: string;
  message: string;
  emailSent: boolean;
}

type Values = Record<string, string>;

export function useAuthFormSubmit(mode: AuthMode) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingVerification | null>(null);

  async function signUp(values: Values) {
    const result = await register({
      fullName: values.fullName, email: values.email, password: values.password,
      confirmPassword: values.confirmPassword, acceptTerms: values.acceptTerms === "on",
      phone: values.phone?.trim() || null,
    });
    setPending({ email: values.email, ...result });
  }

  async function signIn(values: Values) {
    await login({ email: values.email, password: values.password });
    await refresh();
    router.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
  }

  function fail(failure: unknown, email: string) {
    if (failure instanceof ApiError && failure.code === EMAIL_NOT_VERIFIED) {
      setPending({ email, message: failure.message, emailSent: false });
      return;
    }
    setError(failure instanceof ApiError ? failure.message : "Không thể kết nối. Vui lòng thử lại.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Values;
    const issue = mode === "register" ? registerIssue(values) : "";
    if (issue) {
      setError(issue);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await (mode === "register" ? signUp(values) : signIn(values));
    } catch (failure) {
      fail(failure, values.email);
    } finally {
      setBusy(false);
    }
  }

  /** Instant checks; the server repeats every one of them. */
  function registerIssue(values: Values): string {
    if (values.password !== values.confirmPassword) return "Mật khẩu xác nhận không khớp.";
    if (values.phone?.trim() && !normalizeVietnamesePhone(values.phone))
      return "Số điện thoại chưa đúng định dạng Việt Nam, ví dụ 0912 345 678.";
    return "";
  }

  /** Back to the form, e.g. after a typo in the email address. */
  const reset = () => setPending(null);

  return { busy, error, pending, submit, reset };
}
