import { Icon } from "@/components/ui/Icon";

interface RowControlsProps {
  index: number;
  count: number;
  /** Names the row for screen readers, e.g. "ngày 2". */
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}

/** Up, down and remove buttons of one list row; keyboard users reorder with these instead of dragging. */
export function RowControls({ index, count, label, onMove, onRemove }: RowControlsProps) {
  return (
    <div className="adm-row-controls">
      <button type="button" className="adm-icon-button" disabled={index === 0}
        aria-label={`Đưa ${label} lên trên`} onClick={() => onMove(index, index - 1)}>
        <span className="adm-turn-up"><Icon name="chevron" size={16} /></span>
      </button>
      <button type="button" className="adm-icon-button" disabled={index === count - 1}
        aria-label={`Đưa ${label} xuống dưới`} onClick={() => onMove(index, index + 1)}>
        <span className="adm-turn-down"><Icon name="chevron" size={16} /></span>
      </button>
      <button type="button" className="adm-icon-button" aria-label={`Xóa ${label}`} onClick={() => onRemove(index)}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
