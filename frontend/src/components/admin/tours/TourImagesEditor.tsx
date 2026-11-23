"use client";

import { useState, type FormEvent } from "react";
import { useListEditor } from "@/hooks/useListEditor";
import { useSectionSave } from "@/hooks/useSectionSave";
import { EMPTY_IMAGE, imageRowsFrom, MAX_TOUR_IMAGES, toImageInputs, type ImageRow } from "@/lib/admin-tour-images";
import { saveTourImages } from "@/services/admin-catalog";
import type { AdminTourDetail } from "@/types/admin";
import { ImageRowFields } from "./ImageRowFields";
import { LibraryPicker } from "./LibraryPicker";
import { RowControls } from "./RowControls";
import { SectionMessage } from "./SectionMessage";

interface EditorProps {
  tour: AdminTourDetail;
  onChanged: (tour: AdminTourDetail) => void;
}

type List = ReturnType<typeof useListEditor<ImageRow>>;

/** "Ảnh tour": the first photo is the cover. Reorder by dragging a thumbnail or with the up/down buttons. */
export function TourImagesEditor({ tour, onChanged }: EditorProps) {
  const list = useListEditor<ImageRow>(imageRowsFrom(tour.images));
  const { busy, fieldErrors, message, save } = useSectionSave();
  const full = list.rows.length >= MAX_TOUR_IMAGES;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await save(() => saveTourImages(tour.id, toImageInputs(list.values)), "Đã lưu ảnh tour.");
    if (!saved) return;
    onChanged(saved);
    list.reset(imageRowsFrom(saved.images));
  }

  return (
    <form className="adm-panel" noValidate aria-busy={busy} aria-labelledby="images-title"
      onSubmit={event => void submit(event)}>
      <h2 id="images-title">Ảnh tour ({list.rows.length}/{MAX_TOUR_IMAGES})</h2>
      <p className="adm-note">
        Chỉ nhận ảnh Unsplash dạng https://images.unsplash.com/photo-… và phải ghi nguồn trong
        docs/design/image-credits.md. Ảnh đầu tiên là ảnh đại diện. Tour không có ảnh sẽ hiện ảnh minh họa.
      </p>
      <fieldset className="adm-fieldset" disabled={!tour.canEdit}>
        <ImageList list={list} fieldErrors={fieldErrors} />
        <LibraryPicker rows={list.values} disabled={full} onPick={choice =>
          list.add({ url: choice.url, altText: choice.alt })} />
        <div className="adm-actions">
          <button type="button" className="btn btn-outline btn-small" disabled={full}
            onClick={() => list.add(EMPTY_IMAGE)}>Thêm ảnh bằng đường dẫn</button>
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu ảnh"}
          </button>
        </div>
      </fieldset>
      <SectionMessage message={message} />
    </form>
  );
}

function ImageList({ list, fieldErrors }: { list: List; fieldErrors: Record<string, string[]> }) {
  // Index of the photo being dragged; dropping it on another row moves it there (native HTML5 drag and drop).
  const [dragging, setDragging] = useState<number | null>(null);
  if (list.rows.length === 0) return <p className="adm-note">Chưa có ảnh nào.</p>;
  return (
    <ol className="adm-rows">
      {list.rows.map((row, index) => (
        <li key={row.key} className={dragging === index ? "adm-row is-dragging" : "adm-row"}
          onDragOver={event => event.preventDefault()}
          onDrop={() => { if (dragging !== null) list.move(dragging, index); setDragging(null); }}>
          <ImageRowFields index={index} row={row.value} fieldErrors={fieldErrors}
            onChange={patch => list.update(index, patch)}
            onDragStart={() => setDragging(index)} onDragEnd={() => setDragging(null)} />
          <RowControls index={index} count={list.rows.length} label={`ảnh ${index + 1}`}
            onMove={list.move} onRemove={list.remove} />
        </li>
      ))}
    </ol>
  );
}
