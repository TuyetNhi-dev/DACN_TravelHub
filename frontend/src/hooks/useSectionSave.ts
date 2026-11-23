"use client";

import { useState } from "react";
import { ApiError, type FieldErrors } from "@/lib/api-client";

const BAD_REQUEST = 400;

type Message = { kind: "error" | "success"; text: string } | null;

/** Saving one section of an admin page: busy flag, per-row field errors from a 400, one result message. */
export function useSectionSave() {
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<Message>(null);

  /** `done` is the success line, or builds it from the result (e.g. "Đã tạo 5 lịch, bỏ qua…"). */
  async function save<T>(action: () => Promise<T>, done: string | ((result: T) => string)): Promise<T | null> {
    setBusy(true);
    setMessage(null);
    try {
      const result = await action();
      setFieldErrors({});
      setMessage({ kind: "success", text: typeof done === "string" ? done : done(result) });
      return result;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFieldErrors(error.status === BAD_REQUEST ? error.fieldErrors : {});
      setMessage({ kind: "error", text: error.message });
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { busy, fieldErrors, message, save, clearMessage: () => setMessage(null) };
}
