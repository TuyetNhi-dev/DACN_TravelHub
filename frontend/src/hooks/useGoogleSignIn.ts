"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResource } from "@/hooks/useResource";
import { ApiError } from "@/lib/api-client";
import { postLoginPath } from "@/lib/auth";
import { loadGoogleIdentity, readCredential, type GoogleButtonText } from "@/lib/google-identity";
import { getGoogleClientId, signInWithGoogle } from "@/services/auth";

const MAX_BUTTON_WIDTH = 400;

/** Renders Google's own button into `container` and turns its credential into a SàiHành session. */
export function useGoogleSignIn(text: GoogleButtonText) {
  const router = useRouter();
  const { refresh } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const { state } = useResource("google-config", getGoogleClientId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clientId = state.status === "ready" ? state.data : null;

  async function exchange(credential: string | null) {
    if (!credential) return setError("Google không trả về thông tin đăng nhập. Vui lòng thử lại.");
    setBusy(true);
    setError("");
    try {
      const session = await signInWithGoogle(credential);
      await refresh();
      router.replace(postLoginPath(new URLSearchParams(window.location.search).get("next"), session.user));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể đăng nhập bằng Google.");
      setBusy(false);
    }
  }
  const exchangeRef = useRef(exchange);
  useEffect(() => { exchangeRef.current = exchange; });

  useEffect(() => {
    const element = container.current;
    if (!clientId || !element) return;
    loadGoogleIdentity().then(google => {
      google.initialize({
        client_id: clientId, ux_mode: "popup", context: text === "signup_with" ? "signup" : "signin",
        callback: response => void exchangeRef.current(readCredential(response)),
      });
      const width = Math.min(element.offsetWidth || MAX_BUTTON_WIDTH, MAX_BUTTON_WIDTH);
      google.renderButton(element, {
        type: "standard", theme: "outline", size: "large", shape: "pill", text, logo_alignment: "center",
        locale: "vi", width,
      });
    }).catch(() => setError("Không tải được nút đăng nhập Google. Kiểm tra kết nối mạng."));
  }, [clientId, text]);

  return { container, available: Boolean(clientId), busy, error };
}
