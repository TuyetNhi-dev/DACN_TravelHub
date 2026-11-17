"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { vietnamToday } from "@/lib/format";
import { runAdminAction, type AdminAction } from "@/services/admin";
import type { BookingDetail } from "@/types/booking";

interface AdminBookingActionsProps {
  booking: BookingDetail;
  onChanged: (booking: BookingDetail) => void;
}

const SUCCESS_MESSAGES: Record<AdminAction, string> = {
  confirm: "Đã xác nhận đơn.",
  reject: "Đã từ chối đơn và trả lại chỗ (nếu có).",
  complete: "Đã đánh dấu hoàn thành.",
};

/** Mirrors BookingLifecycle on the server, which remains the authority on every transition. */
export function AdminBookingActions({ booking, onChanged }: AdminBookingActionsProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<AdminAction | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const awaiting = booking.itemStatus === (booking.serviceType === "tour" ? "pending" : "awaiting_supplier");
  const needsCode = booking.serviceType !== "tour";
  const lastDay = booking.endDate ?? booking.startDate;
  const canComplete = booking.itemStatus === "confirmed" && lastDay !== null && lastDay < vietnamToday();

  async function run(action: AdminAction) {
    setBusy(action);
    setMessage(null);
    try {
      onChanged(await runAdminAction(booking.id, action, code));
      setMessage({ kind: "success", text: SUCCESS_MESSAGES[action] });
    } catch (failure) {
      const text = failure instanceof ApiError ? failure.message : "Thao tác không thành công.";
      setMessage({ kind: "error", text });
    } finally {
      setBusy(null);
    }
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run("confirm");
  }

  return (
    <div className="sh-form">
      {message && <p className={message.kind === "error" ? "sh-error" : "sh-success"} role="status">{message.text}</p>}
      {awaiting && (
        <form className="sh-form" onSubmit={confirm}>
          <label className="sh-field">
            Mã xác nhận {needsCode ? "của đối tác" : "(không bắt buộc)"}
            <input value={code} onChange={event => setCode(event.target.value)} maxLength={120} required={needsCode}
              placeholder={needsCode ? "Ví dụ: mã đặt phòng / PNR" : "Ghi chú nội bộ"} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy !== null}>
            {busy === "confirm" ? "Đang xác nhận…" : "Xác nhận đơn"}
          </button>
          <button className="btn btn-outline" type="button" disabled={busy !== null} onClick={() => void run("reject")}>
            {busy === "reject" ? "Đang xử lý…" : needsCode ? "Đối tác từ chối" : "Hủy giữ chỗ"}
          </button>
        </form>
      )}
      {canComplete && (
        <button className="btn btn-outline" disabled={busy !== null} onClick={() => void run("complete")}>
          {busy === "complete" ? "Đang xử lý…" : "Đánh dấu hoàn thành"}
        </button>
      )}
      {!awaiting && !canComplete && <p className="sh-hotel-caption">Đơn không còn thao tác chờ xử lý.</p>}
    </div>
  );
}
