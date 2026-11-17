"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { resendVerification } from "@/services/auth";

/** Matches the backend cooldown, so the button never invites a request the server will ignore. */
const COOLDOWN_SECONDS = 60;
const TICK_MS = 1000;

export function ResendVerification({ email, startCoolingDown = false }: {
  email: string;
  /** True right after a mail was sent, so an immediate resend is not offered. */
  startCoolingDown?: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft(value => value - 1), TICK_MS);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setBusy(true);
    setStatus(null);
    try {
      setStatus({ ok: true, text: await resendVerification(email) });
      setSecondsLeft(COOLDOWN_SECONDS);
    } catch (failure) {
      setStatus({ ok: false, text: failure instanceof ApiError ? failure.message : "Không gửi lại được mã." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-resend">
      <Button variant="outline" onClick={() => void resend()} loading={busy} loadingLabel="Đang gửi…"
        disabled={secondsLeft > 0}>
        {secondsLeft > 0 ? `Gửi lại mã sau ${secondsLeft} giây` : "Gửi lại mã"}
      </Button>
      {status && <p className={status.ok ? "auth-success" : "auth-error"} role="status">{status.text}</p>}
    </div>
  );
}
