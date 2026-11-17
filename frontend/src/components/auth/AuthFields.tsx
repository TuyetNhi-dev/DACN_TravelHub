"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface PasswordFieldProps {
  name: "password" | "confirmPassword";
  label: string;
  isNew: boolean;
}

export function PasswordField({ name, label, isNew }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const placeholder = !isNew ? "Nhập mật khẩu" : name === "confirmPassword" ? "Nhập lại mật khẩu" : "Tối thiểu 12 ký tự";
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label} <span aria-hidden="true">*</span></label>
      <div className="auth-password">
        <input id={name} name={name} type={visible ? "text" : "password"} required maxLength={128}
          autoComplete={isNew ? "new-password" : "current-password"} minLength={isNew ? 12 : undefined}
          placeholder={placeholder} />
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
}

export function TextField({ name, label, type = "text", ...input }: TextFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label} <span aria-hidden="true">*</span></label>
      <input id={name} name={name} type={type} required {...input} />
    </div>
  );
}
