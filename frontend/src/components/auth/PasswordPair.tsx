"use client";

import { useId, useState } from "react";
import { checkPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type PasswordLevel } from "@/lib/password-strength";
import { PasswordField } from "./AuthFields";

const LEVEL_TEXT: Record<PasswordLevel, string> = {
  "empty": `Cần ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} ký tự.`,
  "too-short": `Chưa đủ ${PASSWORD_MIN_LENGTH} ký tự.`,
  "ok": "Đạt yêu cầu.",
  "strong": "Mạnh.",
};

interface PasswordPairProps {
  /** "password" on sign-up, "newPassword" on the reset form. */
  name: "password" | "newPassword";
  label: string;
}

/**
 * New password + confirmation, each with the show/hide eye, and a live strength hint that follows the server
 * rule (length 12–128 and matching confirmation). Extra tips are advice only and never block the form.
 */
export function PasswordPair({ name, label }: PasswordPairProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const hintId = useId();
  const check = checkPassword(password, confirmation);
  return (
    <>
      <div className="auth-password-grid">
        <PasswordField name={name} label={label} isNew value={password} onChange={setPassword}
          describedBy={hintId} />
        <PasswordField name="confirmPassword" label="Nhập lại mật khẩu" isNew value={confirmation}
          onChange={setConfirmation} describedBy={hintId} />
      </div>
      <div id={hintId} className="auth-strength" aria-live="polite">
        <span className={`auth-strength-bar auth-strength-bar--${check.level}`} aria-hidden="true"><i /></span>
        <p><b>Độ mạnh:</b> {LEVEL_TEXT[check.level]}
          {confirmation && (check.matches ? " Hai mật khẩu khớp nhau." : " Hai mật khẩu chưa khớp.")}</p>
        {check.lengthOk && check.tips.length > 0 && <p className="auth-strength-tip">Gợi ý: {check.tips.join(" ")}</p>}
      </div>
    </>
  );
}
