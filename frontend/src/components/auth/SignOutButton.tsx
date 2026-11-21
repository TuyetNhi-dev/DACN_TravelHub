"use client";

import { useSignOut } from "@/hooks/useSignOut";

/** "Đăng xuất" on the account page. */
export function SignOutButton() {
  const { busy, error, signOut } = useSignOut();
  return (
    <>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void signOut()}>
        {busy ? "Đang thoát…" : "Đăng xuất"}
      </button>
      {error && <span className="sh-error" role="alert">{error}</span>}
    </>
  );
}
