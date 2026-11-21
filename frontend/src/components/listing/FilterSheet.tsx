"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FilterSheetProps {
  /** Accessible name of the filter region, e.g. "Bộ lọc tour". */
  label: string;
  activeCount: number;
  resultCount: number;
  /** Viewport width (px) at and below which the sidebar no longer fits and becomes a sheet. */
  sheetBelow: number;
  /** Class of the sidebar <aside> on wide screens. */
  className?: string;
  children: ReactNode;
}

/**
 * Wide screens: the filters render in place as a sidebar. Phones and tablets: a "Bộ lọc" button opens the
 * same filters in a bottom sheet built on <dialog>, which gives focus trapping, Esc and the backdrop for free.
 */
export function FilterSheet({ label, activeCount, resultCount, sheetBelow, className, children }: FilterSheetProps) {
  const asSheet = useMediaQuery(`(max-width: ${sheetBelow}px)`);
  const dialog = useRef<HTMLDialogElement>(null);
  if (!asSheet) return <aside className={className} aria-label={label}>{children}</aside>;

  const close = () => dialog.current?.close();
  return (
    <div className="filter-sheet-anchor">
      <button type="button" className="filter-sheet-toggle" aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}>
        <Icon name="menu" size={18} />Bộ lọc
        {activeCount > 0 && <span aria-label={`${activeCount} bộ lọc đang bật`}>{activeCount}</span>}
      </button>
      <dialog ref={dialog} className="filter-sheet" aria-label={label}>
        <div className="filter-sheet-head">
          <b>{label}</b>
          <button type="button" className="filter-sheet-close" onClick={close} aria-label="Đóng bộ lọc">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="filter-sheet-body">{children}</div>
        <div className="filter-sheet-foot">
          <button type="button" className="btn btn-primary" onClick={close}>Xem {resultCount} kết quả</button>
        </div>
      </dialog>
    </div>
  );
}
