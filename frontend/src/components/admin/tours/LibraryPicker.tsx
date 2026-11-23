"use client";

import { useMemo, useState } from "react";
import { groupByPlace, unusedChoices, type ImageRow } from "@/lib/admin-tour-images";
import { libraryPhotoChoices, type LibraryChoice } from "@/lib/media";

interface LibraryPickerProps {
  rows: ImageRow[];
  disabled: boolean;
  onPick: (choice: LibraryChoice) => void;
}

/** Adds a photo from the credited library (frontend/src/data/photo-library.ts) with its caption filled in. */
export function LibraryPicker({ rows, disabled, onPick }: LibraryPickerProps) {
  const all = useMemo(() => libraryPhotoChoices(), []);
  const groups = groupByPlace(unusedChoices(all, rows));
  const [url, setUrl] = useState("");
  const chosen = all.find(choice => choice.url === url);

  return (
    <div className="adm-picker">
      <label className="sh-field">
        Chọn từ thư viện ảnh đã ghi nguồn
        <select value={url} disabled={disabled} onChange={event => setUrl(event.target.value)}>
          <option value="">Chọn ảnh…</option>
          {groups.map(([place, choices]) => (
            <optgroup key={place} label={place}>
              {choices.map(choice => <option key={choice.url} value={choice.url}>{choice.alt}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-outline btn-small" disabled={disabled || !chosen}
        onClick={() => { if (chosen) onPick(chosen); setUrl(""); }}>
        Thêm ảnh này
      </button>
    </div>
  );
}
