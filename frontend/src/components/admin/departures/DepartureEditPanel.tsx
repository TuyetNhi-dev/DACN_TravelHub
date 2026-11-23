"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SectionMessage } from "@/components/admin/tours/SectionMessage";
import { useSectionSave } from "@/hooks/useSectionSave";
import { termsFormFrom, toUpdateTerms } from "@/lib/admin-departures";
import type { TermsForm } from "@/lib/admin-forms";
import { formatDate } from "@/lib/format";
import { updateDeparture } from "@/services/admin-catalog";
import type { AdminDeparture, AdminLookups } from "@/types/admin";
import { DepartureTermsFields } from "./DepartureTermsFields";

interface EditPanelProps {
  departure: AdminDeparture;
  lookups: AdminLookups;
  onSaved: (departure: AdminDeparture) => void;
  onClose: () => void;
}

/** Edits seats and prices of one departure; seats can never drop below what is already booked (server: 409). */
export function DepartureEditPanel({ departure, lookups, onSaved, onClose }: EditPanelProps) {
  const [form, setForm] = useState<TermsForm>(() => termsFormFrom(departure));
  const { busy, fieldErrors, message, save } = useSectionSave();
  const heading = useRef<HTMLHeadingElement>(null);
  // Opening the panel from a table row moves focus here, so keyboard users land on the form they asked for.
  useEffect(() => heading.current?.focus(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = await save(() => updateDeparture(departure.id, toUpdateTerms(form)), "Đã lưu lịch khởi hành.");
    if (next) onSaved(next);
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="departure-edit-title"
      onSubmit={event => void submit(event)}>
      <h2 id="departure-edit-title" ref={heading} tabIndex={-1}>
        Sửa lịch {formatDate(departure.departureDate)} · {departure.tourCode}
      </h2>
      <p className="adm-note">Khởi hành từ {departure.departureFrom}; đã đặt {departure.reservedSeats} chỗ.</p>
      <DepartureTermsFields idPrefix="edit-dep" form={form} lookups={lookups} withLocation={false}
        errorOf={key => fieldErrors[key]?.[0]}
        onChange={(key, value) => setForm(current => ({ ...current, [key]: value }))} />
      <div className="adm-actions">
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>Đóng</button>
      </div>
      <SectionMessage message={message} />
    </form>
  );
}
