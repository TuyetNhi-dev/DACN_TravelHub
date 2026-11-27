"use client";

import { useState } from "react";
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api-client";
import { checkInPassengers, getCheckInBoard, scanTicket, undoCheckIn } from "@/services/admin-check-in";
import type { CheckInBoard } from "@/types/ticket";

export interface CheckInMessage {
  tone: "success" | "error";
  text: string;
}

const failureText = (failure: unknown, fallback: string) =>
  failure instanceof ApiError ? failure.message : fallback;

/** The board of one departure plus its three actions; every write answers with the fresh board. */
export function useCheckInBoard(departureId: string) {
  const { state, retry, replace } = useResource(`admin-check-in:${departureId}`,
    signal => getCheckInBoard(departureId, signal));
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<CheckInMessage | null>(null);

  async function run<T>(work: () => Promise<T>, done: (result: T) => string, fallback: string) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ tone: "success", text: done(await work()) });
    } catch (failure) {
      setMessage({ tone: "error", text: failureText(failure, fallback) });
    } finally {
      setBusy(false);
    }
  }

  const scan = (payload: string) => run(() => scanTicket(departureId, payload.trim()), booking => {
    setScannedId(booking.bookingId);
    return `Vé hợp lệ: đơn ${booking.code}. Chọn khách có mặt rồi bấm check-in.`;
  }, "Không kiểm tra được vé. Vui lòng thử lại.");

  const checkIn = (passengerIds: string[]) => run(() => checkInPassengers(departureId, passengerIds),
    (board: CheckInBoard) => {
      replace(board);
      return `Đã check-in ${passengerIds.length} khách.`;
    }, "Không check-in được. Vui lòng thử lại.");

  const undo = (passengerId: string) => run(() => undoCheckIn(departureId, passengerId), (board: CheckInBoard) => {
    replace(board);
    return "Đã hoàn tác check-in.";
  }, "Không hoàn tác được. Vui lòng thử lại.");

  return { state, retry, scannedId, clearScan: () => setScannedId(null), busy, message, scan, checkIn, undo };
}
