"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { holdsSeats } from "@/lib/booking-rules";
import { vietnamToday } from "@/lib/format";
import { runAdminAction, type AdminAction } from "@/services/admin";
import type { BookingDetail } from "@/types/booking";

interface AdminBookingActionsProps {
  booking: BookingDetail;
  onChanged: (booking: BookingDetail) => void;
}

type Message = { kind: "error" | "success"; text: string } | null;

const SUCCESS_MESSAGES: Record<AdminAction, string> = {
  confirm: "Đã ghi nhận đối tác xác nhận. Khách có thể thanh toán.",
  reject: "Đã từ chối đơn và trả lại chỗ (nếu có).",
  complete: "Đã đánh dấu hoàn thành.",
};

/**
 * Mirrors BookingLifecycle on the server, which remains the authority on every transition. Tours are
 * confirmed by the customer's payment, so staff can only release an unpaid hold; hotels and flights are
 * confirmed with the partner first, after which the customer pays.
 */
export function AdminBookingActions({ booking, onChanged }: AdminBookingActionsProps) {
  const [busy, setBusy] = useState<AdminAction | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const actions = availableActions(booking);

  async function run(action: AdminAction, code = "") {
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

  return (
    <div className="sh-form">
      {message && (
        <p className={message.kind === "error" ? "sh-error" : "sh-success"} role="status">{message.text}</p>
      )}
      {actions.partner && <PartnerConfirmForm busy={busy} onRun={run} />}
      {actions.releaseHold && (
        <>
          <p className="sh-hotel-caption">
            Đơn giữ chỗ (tour, vé deal) được xác nhận tự động khi khách thanh toán trong hạn.
          </p>
          <button className="btn btn-outline" type="button" disabled={busy !== null} onClick={() => void run("reject")}>
            {busy === "reject" ? "Đang xử lý…" : "Hủy giữ chỗ"}
          </button>
        </>
      )}
      {actions.complete && (
        <button className="btn btn-outline" disabled={busy !== null} onClick={() => void run("complete")}>
          {busy === "complete" ? "Đang xử lý…" : "Đánh dấu hoàn thành"}
        </button>
      )}
      {!actions.partner && !actions.releaseHold && !actions.complete && (
        <p className="sh-hotel-caption">Đơn không còn thao tác chờ xử lý.</p>
      )}
    </div>
  );
}

function availableActions(booking: BookingDetail) {
  const seatHold = holdsSeats(booking);
  const lastDay = booking.endDate ?? booking.startDate;
  return {
    partner: !seatHold && booking.itemStatus === "awaiting_supplier",
    releaseHold: seatHold && booking.itemStatus === "pending",
    complete: booking.itemStatus === "confirmed" && lastDay !== null && lastDay < vietnamToday(),
  };
}

interface PartnerConfirmFormProps {
  busy: AdminAction | null;
  onRun: (action: AdminAction, code?: string) => Promise<void>;
}

function PartnerConfirmForm({ busy, onRun }: PartnerConfirmFormProps) {
  const [code, setCode] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onRun("confirm", code);
  }

  return (
    <form className="sh-form" onSubmit={submit}>
      <label className="sh-field">
        Mã xác nhận của đối tác
        <input value={code} onChange={event => setCode(event.target.value)} maxLength={120} required
          placeholder="Ví dụ: mã đặt phòng / PNR" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy !== null}>
        {busy === "confirm" ? "Đang lưu…" : "Đối tác đã xác nhận"}
      </button>
      <button className="btn btn-outline" type="button" disabled={busy !== null} onClick={() => void onRun("reject")}>
        {busy === "reject" ? "Đang xử lý…" : "Đối tác từ chối"}
      </button>
    </form>
  );
}
