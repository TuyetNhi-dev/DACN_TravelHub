"use client";

import type { FormEvent } from "react";
import { FieldShell } from "@/components/services/ServiceFields";
import { useListEditor } from "@/hooks/useListEditor";
import { useSectionSave } from "@/hooks/useSectionSave";
import {
  EMPTY_INCLUSION, joinInclusions, MAX_INCLUSION_TEXT, MAX_INCLUSIONS, rowError, splitInclusions, type InclusionRow,
} from "@/lib/admin-tour-content";
import { INCLUSION_TYPES } from "@/lib/admin-labels";
import type { FieldErrors } from "@/lib/api-client";
import { saveInclusions } from "@/services/admin-catalog";
import type { AdminTourDetail, InclusionType } from "@/types/admin";
import { RowControls } from "./RowControls";
import { SectionMessage } from "./SectionMessage";

interface EditorProps {
  tour: AdminTourDetail;
  onChanged: (tour: AdminTourDetail) => void;
}

type List = ReturnType<typeof useListEditor<InclusionRow>>;

/** "Giá bao gồm / không bao gồm": two lists saved together; server error indexes count "bao gồm" first. */
export function TourInclusionsEditor({ tour, onChanged }: EditorProps) {
  const initial = splitInclusions(tour.inclusions);
  const included = useListEditor<InclusionRow>(initial.included);
  const excluded = useListEditor<InclusionRow>(initial.excluded);
  const { busy, fieldErrors, message, save } = useSectionSave();
  const full = included.rows.length + excluded.rows.length >= MAX_INCLUSIONS;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = joinInclusions(included.values, excluded.values);
    const saved = await save(() => saveInclusions(tour.id, items), "Đã lưu giá bao gồm / không bao gồm.");
    if (!saved) return;
    onChanged(saved);
    const next = splitInclusions(saved.inclusions);
    included.reset(next.included);
    excluded.reset(next.excluded);
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="inclusions-title"
      onSubmit={event => void submit(event)}>
      <h2 id="inclusions-title">Giá bao gồm / không bao gồm</h2>
      <fieldset className="adm-fieldset" disabled={!tour.canEdit}>
        <InclusionList title="Giá tour bao gồm" idPrefix="included" list={included} offset={0} full={full}
          fieldErrors={fieldErrors} />
        <InclusionList title="Giá tour không bao gồm" idPrefix="excluded" list={excluded}
          offset={included.rows.length} full={full} fieldErrors={fieldErrors} />
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu giá bao gồm"}
        </button>
      </fieldset>
      <SectionMessage message={message} />
    </form>
  );
}

interface InclusionListProps {
  title: string;
  idPrefix: string;
  list: List;
  /** Position of this list's first row in the saved array, to read the server's "items[i]" errors. */
  offset: number;
  full: boolean;
  fieldErrors: FieldErrors;
}

function InclusionList({ title, idPrefix, list, offset, full, fieldErrors }: InclusionListProps) {
  return (
    <div className="adm-subsection">
      <h3>{title}</h3>
      {list.rows.length === 0 && <p className="adm-note">Chưa có mục nào.</p>}
      <ol className="adm-rows">
        {list.rows.map((row, index) => (
          <li key={row.key} className="adm-row">
            <InclusionFields id={`${idPrefix}-${index}`} row={row.value}
              errorOf={field => rowError(fieldErrors, "items", offset + index, field)}
              onChange={patch => list.update(index, patch)} />
            <RowControls index={index} count={list.rows.length} label={`mục ${index + 1} (${title.toLowerCase()})`}
              onMove={list.move} onRemove={list.remove} />
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-outline btn-small" disabled={full}
        onClick={() => list.add(EMPTY_INCLUSION)}>Thêm mục</button>
    </div>
  );
}

interface InclusionFieldsProps {
  id: string;
  row: InclusionRow;
  errorOf: (field: string) => string | undefined;
  onChange: (patch: Partial<InclusionRow>) => void;
}

function InclusionFields({ id, row, errorOf, onChange }: InclusionFieldsProps) {
  return (
    <div className="adm-row-fields adm-row-fields--inline">
      <FieldShell fieldKey={`${id}-type`} label="Loại" required error={errorOf("serviceType")}>
        {a11y => (
          <select {...a11y} value={row.serviceType}
            onChange={e => onChange({ serviceType: e.target.value as InclusionType })}>
            {INCLUSION_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        )}
      </FieldShell>
      <FieldShell fieldKey={`${id}-description`} label="Nội dung" required error={errorOf("description")}>
        {a11y => (
          <input {...a11y} maxLength={MAX_INCLUSION_TEXT} value={row.description}
            onChange={e => onChange({ description: e.target.value })} />
        )}
      </FieldShell>
    </div>
  );
}
