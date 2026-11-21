"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-strength";

interface PasswordFieldProps {
  name: "password" | "confirmPassword" | "newPassword";
  label: string;
  isNew: boolean;
  /** Shown at the end of the label row, e.g. the "Quên mật khẩu?" link. */
  aside?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  describedBy?: string;
}

export function PasswordField({ name, label, isNew, aside, value, onChange, describedBy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const placeholder = !isNew ? "Nhập mật khẩu"
    : name === "confirmPassword" ? "Nhập lại mật khẩu" : `Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`;
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={name}>{label} <span aria-hidden="true">*</span></label>
        {aside}
      </div>
      <div className="auth-password">
        <input id={name} name={name} type={visible ? "text" : "password"} required maxLength={PASSWORD_MAX_LENGTH}
          autoComplete={isNew ? "new-password" : "current-password"}
          minLength={isNew ? PASSWORD_MIN_LENGTH : undefined} placeholder={placeholder} aria-describedby={describedBy}
          {...(onChange ? { value, onChange: event => onChange(event.target.value) } : {})} />
        <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`}>
          <Icon name={visible ? "eyeOff" : "eye"} />
        </button>
      </div>
    </div>
  );
}

interface TextFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  placeholder: string;
  maxLength: number;
  minLength?: number;
  pattern?: string;
  title?: string;
  inputMode?: "text" | "email" | "tel";
  /** Optional fields say so in the label instead of showing the red asterisk. */
  required?: boolean;
  hint?: string;
}

export function TextField({ name, label, type = "text", required = true, hint, ...input }: TextFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="auth-field">
      <label htmlFor={name}>
        {label} {required ? <span aria-hidden="true">*</span> : <small>(không bắt buộc)</small>}
      </label>
      <input id={name} name={name} type={type} required={required} aria-describedby={hintId} {...input} />
      {hint && <small id={hintId} className="auth-hint">{hint}</small>}
    </div>
  );
}
