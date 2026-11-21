"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { acceptTerms } from "@/services/auth";
import { useAuth } from "./AuthProvider";
import { SignOutButton } from "./SignOutButton";
import { DATA_PROTECTION_PATH, TERMS_PATH, TermsConsent } from "./TermsConsent";

/** Pages that stay readable while the agreement is pending: the documents being agreed to. */
const READABLE_PATHS = [DATA_PROTECTION_PATH, TERMS_PATH, "/privacy"];

/**
 * A signed-in account that has not agreed yet (first Google sign-in, or an account created before consent was
 * stored) sees "Hoàn tất đăng ký" instead of the page. The API refuses every signed-in feature with
 * 403 "terms_required" anyway; this screen only explains it and offers the two ways out: agree, or sign out.
 */
export function TermsGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const pathname = usePathname();
  if (!session || session.termsAccepted || READABLE_PATHS.includes(pathname)) return children;
  return <CompleteSignup name={session.user.fullName} email={session.user.email} />;
}

function CompleteSignup({ name, email }: { name: string; email: string }) {
  const { refresh } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function agree() {
    setBusy(true);
    setError("");
    try {
      await acceptTerms();
      await refresh();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể lưu lựa chọn. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="auth-page auth-stage">
      <section className="auth-card auth-form-card terms-gate" aria-labelledby="terms-gate-title">
        <span className="otp-step-icon" aria-hidden="true"><Icon name="shield" size={26} /></span>
        <div className="auth-intro">
          <h1 id="terms-gate-title">Hoàn tất đăng ký</h1>
          <p>Chào {name} ({email}). Trước khi dùng các tính năng của tài khoản như đặt tour, giỏ hàng hay xem đơn, vui
            lòng đọc và đồng ý với các văn bản dưới đây.</p>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <form onSubmit={event => { event.preventDefault(); if (agreed) void agree(); }}>
          <TermsConsent name="accept" checked={agreed} onChange={setAgreed} />
          <Button type="submit" className="auth-submit" loading={busy} disabled={!agreed}>Đồng ý và tiếp tục</Button>
        </form>
        <div className="terms-gate-leave">
          <span>Không muốn tiếp tục?</span>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
