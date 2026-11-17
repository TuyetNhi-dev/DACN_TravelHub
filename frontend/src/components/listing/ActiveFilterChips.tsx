import { Icon } from "@/components/ui/Icon";

interface Chip<K extends string> {
  key: K;
  label: string;
}

interface ActiveFilterChipsProps<K extends string> {
  chips: Chip<K>[];
  onRemove: (key: K) => void;
  onClear: () => void;
}

/** Shows what is filtering the results; each chip removes its own filter. */
export function ActiveFilterChips<K extends string>({ chips, onRemove, onClear }: ActiveFilterChipsProps<K>) {
  if (chips.length === 0) return null;
  return (
    <div className="listing-chips" role="group" aria-label="Bộ lọc đang áp dụng">
      {chips.map(chip => (
        <button key={chip.key} type="button" className="listing-chip" onClick={() => onRemove(chip.key)}
          aria-label={`Bỏ lọc ${chip.label}`}>
          {chip.label}<Icon name="close" size={14} />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" className="listing-chip-clear" onClick={onClear}>Xóa tất cả</button>
      )}
    </div>
  );
}
