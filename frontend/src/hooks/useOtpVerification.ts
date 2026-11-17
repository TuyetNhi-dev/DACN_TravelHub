"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { OTP_LENGTH } from "@/components/auth/OtpInput";
import { ApiError } from "@/lib/api-client";
import { safeReturnPath } from "@/lib/auth";
import { verifyEmail } from "@/services/auth";

/** Verifies the emailed code; success signs the user in and continues to the page they came from. */
export function useOtpVerification(email: string) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function verify(value = code) {
    if (busy || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setError("");
    try {
      await verifyEmail(email, value);
      await refresh();
      router.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể kết nối. Vui lòng thử lại.");
      setCode("");
      setBusy(false);
    }
  }

  /** Submits as soon as the last digit arrives, the way banking and travel apps behave. */
  function change(value: string) {
    setCode(value);
    if (error) setError("");
    if (value.length === OTP_LENGTH) void verify(value);
  }

  return { code, busy, error, change, verify };
}
