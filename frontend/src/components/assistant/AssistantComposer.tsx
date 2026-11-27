"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { MAX_MESSAGE_LENGTH, canSend, lengthHint } from "@/lib/assistant";

/** keyCode 229: a key handled by an input method (Telex, VNI) while it is still composing a letter. */
const IME_KEY_CODE = 229;

interface AssistantComposerProps {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  sending: boolean;
}

export function AssistantComposer({ inputId, value, onChange, onSubmit, sending }: AssistantComposerProps) {
  const hint = lengthHint(value);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (canSend(value) && !sending) onSubmit(value);
  }

  // Enter sends, Shift+Enter breaks the line. While a Vietnamese IME composes, Enter confirms the letter instead.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing || event.keyCode === IME_KEY_CODE) return;
    event.preventDefault();
    submit();
  }

  return (
    <form className="assistant-composer" onSubmit={submit}>
      <label htmlFor={inputId} className="sr-only">Câu hỏi cho trợ lý</label>
      <textarea id={inputId} value={value} rows={2} maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Hỏi về tour, chính sách…"
        onChange={event => onChange(event.target.value)} onKeyDown={onKeyDown}
        aria-describedby={`${inputId}-note`} />
      <button type="submit" className="assistant-send" disabled={!canSend(value) || sending}
        aria-label={sending ? "Đang gửi câu hỏi" : "Gửi câu hỏi"}>
        <Icon name="arrow" size={18} />
      </button>
      <p id={`${inputId}-note`} className="assistant-note">
        {hint && <span className="assistant-count">{hint}</span>}
        Trợ lý chỉ tư vấn, không đặt chỗ. Đừng nhập số điện thoại, email hay giấy tờ.
      </p>
    </form>
  );
}
