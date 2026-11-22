"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useSavePhone } from "@/hooks/useSavePhone";
import { VIETNAMESE_PHONE_HINT } from "@/lib/phone-vn";

interface ContactPhoneFieldProps {
  phone: string | null;
}

/**
 * Shows the saved phone with an inline editor. It may sit inside a booking <form>, so it uses a plain
 * button and handles Enter itself instead of nesting a second form.
 */
export function ContactPhoneField({ phone }: ContactPhoneFieldProps) {
  const [editing, setEditing] = useState(!phone);
  const [draft, setDraft] = useState(phone ?? "");
  const { save, busy, error } = useSavePhone();

  async function commit() {
    if (await save(draft)) setEditing(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault(); // Never submit the surrounding booking form from here.
    void commit();
  }

  if (!editing && phone) {
    return (
      <div className="contact-phone">
        <span className="contact-phone-value">{phone}</span>
        <button type="button" className="contact-edit" onClick={() => { setDraft(phone); setEditing(true); }}>
          Sửa
        </button>
      </div>
    );
  }
  return (
    <div className="contact-phone-editor">
      <input type="tel" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={onKeyDown}
        aria-label="Số điện thoại liên hệ" autoComplete="tel" inputMode="tel" placeholder="090…" maxLength={20}
        aria-describedby="contact-phone-hint" aria-invalid={Boolean(error) || undefined} />
      <small id="contact-phone-hint" className="contact-phone-hint">{VIETNAMESE_PHONE_HINT}</small>
      <Button size="sm" onClick={() => void commit()} loading={busy} loadingLabel="Đang lưu…">Lưu</Button>
      {phone && <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>}
      {error && <p className="sh-error" role="alert">{error}</p>}
    </div>
  );
}
