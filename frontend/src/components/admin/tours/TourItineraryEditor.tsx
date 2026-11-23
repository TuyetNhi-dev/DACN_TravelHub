"use client";

import type { FormEvent } from "react";
import { FieldShell } from "@/components/services/ServiceFields";
import { useListEditor } from "@/hooks/useListEditor";
import { useSectionSave } from "@/hooks/useSectionSave";
import {
  dayRowsFrom, EMPTY_DAY, itineraryWarning, MAX_DAY_TEXT, MAX_ITINERARY_DAYS, rowError, toItinerary, type DayRow,
} from "@/lib/admin-tour-content";
import type { FieldErrors } from "@/lib/api-client";
import { saveItinerary } from "@/services/admin-catalog";
import type { AdminTourDetail } from "@/types/admin";
import { RowControls } from "./RowControls";
import { SectionMessage } from "./SectionMessage";

interface EditorProps {
  tour: AdminTourDetail;
  onChanged: (tour: AdminTourDetail) => void;
}

type List = ReturnType<typeof useListEditor<DayRow>>;

/** "Lịch trình": one row per day; the whole list is saved at once, in the order shown. */
export function TourItineraryEditor({ tour, onChanged }: EditorProps) {
  const list = useListEditor<DayRow>(dayRowsFrom(tour.itinerary));
  const { busy, fieldErrors, message, save } = useSectionSave();
  const warning = itineraryWarning(list.rows.length, tour.durationDays);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await save(() => saveItinerary(tour.id, toItinerary(list.values)), "Đã lưu lịch trình.");
    if (!saved) return;
    onChanged(saved);
    list.reset(dayRowsFrom(saved.itinerary));
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="itinerary-title"
      onSubmit={event => void submit(event)}>
      <h2 id="itinerary-title">Lịch trình ({list.rows.length} ngày)</h2>
      {warning && <p className="adm-note" role="status">{warning}</p>}
      <fieldset className="adm-fieldset" disabled={!tour.canEdit}>
        <DayList list={list} fieldErrors={fieldErrors} />
        <div className="adm-actions">
          <button type="button" className="btn btn-outline btn-small"
            disabled={list.rows.length >= MAX_ITINERARY_DAYS} onClick={() => list.add(EMPTY_DAY)}>
            Thêm ngày
          </button>
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu lịch trình"}
          </button>
        </div>
      </fieldset>
      <SectionMessage message={message} />
    </form>
  );
}

function DayList({ list, fieldErrors }: { list: List; fieldErrors: FieldErrors }) {
  if (list.rows.length === 0) return <p className="adm-note">Chưa có ngày nào trong lịch trình.</p>;
  return (
    <ol className="adm-rows">
      {list.rows.map((row, index) => (
        <li key={row.key} className="adm-row">
          <DayFields index={index} row={row.value} errorOf={field => rowError(fieldErrors, "days", index, field)}
            onChange={patch => list.update(index, patch)} />
          <RowControls index={index} count={list.rows.length} label={`ngày ${index + 1}`}
            onMove={list.move} onRemove={list.remove} />
        </li>
      ))}
    </ol>
  );
}

interface DayFieldsProps {
  index: number;
  row: DayRow;
  errorOf: (field: string) => string | undefined;
  onChange: (patch: Partial<DayRow>) => void;
}

function DayFields({ index, row, errorOf, onChange }: DayFieldsProps) {
  return (
    <div className="adm-row-fields">
      <FieldShell fieldKey={`day-${index}-title`} label={`Ngày ${index + 1}: tiêu đề`} required
        error={errorOf("title")}>
        {a11y => (
          <input {...a11y} maxLength={255} value={row.title} onChange={e => onChange({ title: e.target.value })} />
        )}
      </FieldShell>
      <FieldShell fieldKey={`day-${index}-description`} label="Nội dung" required={false}
        error={errorOf("description")}>
        {a11y => (
          <textarea {...a11y} rows={3} maxLength={MAX_DAY_TEXT} value={row.description}
            onChange={e => onChange({ description: e.target.value })} />
        )}
      </FieldShell>
    </div>
  );
}
