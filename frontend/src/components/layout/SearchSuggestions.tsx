import { Icon, type IconName } from "@/components/ui/Icon";
import type { SuggestKind, SuggestOption } from "@/lib/tour-suggest";

const KIND_ICONS: Record<SuggestKind, IconName> = { destination: "map", tour: "ticket", search: "search" };

interface SearchSuggestionsProps {
  id: string;
  options: SuggestOption[];
  active: number;
  optionId: (index: number) => string;
  status: "loading" | "ready" | "error";
  onPick: (option: SuggestOption) => void;
}

/** The listbox under the header search box; the input keeps focus, so options act on mouse down. */
export function SearchSuggestions({ id, options, active, optionId, status, onPick }: SearchSuggestionsProps) {
  const found = options.length > 1;
  const message = status === "loading" ? "Đang tìm gợi ý…"
    : status === "error" ? "Chưa tải được gợi ý. Bạn vẫn có thể tìm theo từ khóa."
      : found ? "" : "Không có điểm đến hay tour nào khớp.";
  return (
    <div className="search-suggest">
      <p className="search-suggest-status" role="status">{message}</p>
      <ul id={id} role="listbox" aria-label="Gợi ý tìm kiếm">
        {options.map((option, index) => (
          <li key={option.key} id={optionId(index)} role="option" aria-selected={index === active}
            className={index === active ? "is-active" : undefined}
            onMouseDown={event => { event.preventDefault(); onPick(option); }}>
            <span className="search-suggest-icon" aria-hidden="true">
              <Icon name={KIND_ICONS[option.kind]} size={16} />
            </span>
            <span className="search-suggest-text">
              <b>{option.label}</b>
              <small>{option.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
