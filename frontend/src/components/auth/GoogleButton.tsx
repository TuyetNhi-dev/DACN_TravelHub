"use client";

import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import type { GoogleButtonText } from "@/lib/google-identity";

/** "Hoặc" divider plus Google's official button. Renders nothing until the server provides a Client ID. */
export function GoogleButton({ text = "continue_with" }: { text?: GoogleButtonText }) {
  const { container, available, busy, error } = useGoogleSignIn(text);
  if (!available) return null;
  return (
    <div className="auth-google">
      <div className="auth-divider" role="separator"><span>Hoặc</span></div>
      <div ref={container} className="auth-google-button" aria-busy={busy || undefined} />
      {busy && <p className="auth-google-status" role="status">Đang đăng nhập bằng Google…</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
