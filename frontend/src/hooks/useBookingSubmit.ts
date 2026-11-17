"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { PHONE_REQUIRED } from "@/types/auth";
import type { BookingDetail } from "@/types/booking";

/** Submits a booking once, surfaces the server's message, then opens the new order. */
export function useBookingSubmit() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(create: () => Promise<BookingDetail>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const booking = await create();
      router.push(`/bookings/${encodeURIComponent(booking.id)}?created=1`);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể tạo đơn. Vui lòng thử lại.");
      // The saved phone was removed elsewhere: reload the account so the contact block asks for it again.
      if (failure instanceof ApiError && failure.code === PHONE_REQUIRED) await refresh();
      setBusy(false);
    }
  }

  return { submit, busy, error, setError };
}
