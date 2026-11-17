"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * Six one-digit boxes acting as one field: typing moves forward, Backspace moves back, and pasting or
 * one-time-code autofill fills every box at once. Screen readers hear one labelled group.
 */
export function OtpInput({ value, onChange, disabled = false, invalid = false }: OtpInputProps) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function setFrom(index: number, typed: string) {
    const clean = typed.replace(/\D/g, "");
    if (!clean) return;
    const next = (value.slice(0, index) + clean).slice(0, OTP_LENGTH);
    onChange(next);
    boxes.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const target = digits[index] ? index : Math.max(index - 1, 0);
      onChange(value.slice(0, target));
      boxes.current[target]?.focus();
    }
    if (event.key === "ArrowLeft") boxes.current[index - 1]?.focus();
    if (event.key === "ArrowRight") boxes.current[index + 1]?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    setFrom(0, event.clipboardData.getData("text"));
  }

  return (
    <div className={`otp-input${invalid ? " is-invalid" : ""}`} role="group" aria-label="Mã xác nhận 6 chữ số">
      {digits.map((digit, index) => (
        <input key={index} ref={element => { boxes.current[index] = element; }} value={digit}
          inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={OTP_LENGTH}
          aria-label={`Chữ số ${index + 1}`} aria-invalid={invalid || undefined} disabled={disabled}
          onChange={event => setFrom(index, event.target.value.slice(digit ? 1 : 0) || event.target.value)}
          onKeyDown={event => onKeyDown(index, event)} onPaste={onPaste}
          onFocus={event => event.target.select()} />
      ))}
    </div>
  );
}
