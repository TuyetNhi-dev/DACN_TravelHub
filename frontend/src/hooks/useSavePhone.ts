"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { updatePhone } from "@/services/auth";
import { normalizeVietnamesePhone, VIETNAMESE_PHONE_MESSAGE } from "@/lib/phone-vn";

/** Saves the contact phone to the account and refreshes the session so every form sees the new value. */
export function useSavePhone() {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(phone: string): Promise<boolean> {
    const value = normalizeVietnamesePhone(phone);
    if (!value) {
      setError(VIETNAMESE_PHONE_MESSAGE);
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await updatePhone(value);
      await refresh();
      return true;
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không lưu được số điện thoại.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { save, busy, error };
}
