"use client";

import Image from "next/image";
import { FieldShell } from "@/components/services/ServiceFields";
import { isAllowedImageUrl, MAX_ALT_TEXT, type ImageRow } from "@/lib/admin-tour-images";
import { rowError } from "@/lib/admin-tour-content";
import type { FieldErrors } from "@/lib/api-client";

interface ImageRowFieldsProps {
  index: number;
  row: ImageRow;
  fieldErrors: FieldErrors;
  onChange: (patch: Partial<ImageRow>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

/** Thumbnail (the drag handle), link and alt text of one photo. The preview appears once the link is accepted. */
export function ImageRowFields({ index, row, fieldErrors, onChange, onDragStart, onDragEnd }: ImageRowFieldsProps) {
  const valid = isAllowedImageUrl(row.url);
  return (
    <div className="adm-image-row">
      <figure className="adm-thumb" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
        title="Kéo để đổi thứ tự">
        {valid ? <Image src={row.url.trim()} alt="" fill sizes="120px" /> : <span aria-hidden="true">Chưa có ảnh</span>}
        {index === 0 && <figcaption>Ảnh đại diện</figcaption>}
      </figure>
      <div className="adm-row-fields">
        <FieldShell fieldKey={`image-${index}-url`} label={`Ảnh ${index + 1}: đường dẫn`} required
          hint={row.url && !valid ? "Đường dẫn chưa đúng dạng https://images.unsplash.com/photo-…" : undefined}
          error={rowError(fieldErrors, "images", index, "url")}>
          {a11y => (
            <input {...a11y} type="url" inputMode="url" value={row.url}
              onChange={e => onChange({ url: e.target.value })} />
          )}
        </FieldShell>
        <FieldShell fieldKey={`image-${index}-alt`} label="Mô tả ảnh (cho người khiếm thị)" required={false}
          error={rowError(fieldErrors, "images", index, "altText")}>
          {a11y => (
            <input {...a11y} maxLength={MAX_ALT_TEXT} value={row.altText}
              onChange={e => onChange({ altText: e.target.value })} />
          )}
        </FieldShell>
      </div>
    </div>
  );
}
