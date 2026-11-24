"use client";

import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { useTourSuggestions } from "@/hooks/useTourSuggestions";
import { canSuggest, moveActive, suggestOptions, type SuggestOption } from "@/lib/tour-suggest";

/**
 * State of the header search combobox: the typed text, whether the list is open, the highlighted option and the
 * keys of the WAI-ARIA combobox pattern (arrows move, Enter opens, Escape closes).
 */
export function useSearchCombobox() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const { state, typing } = useTourSuggestions(text);
  const options = suggestOptions(text, state.status === "ready" ? state.data : null);
  // A newer, shorter list may arrive while an option is highlighted; never point past its end.
  const active = highlighted < options.length ? highlighted : -1;

  function close() {
    setOpen(false);
    setHighlighted(-1);
  }

  function pick(option: SuggestOption) {
    close();
    if (option.kind !== "search") setText("");
    router.push(option.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !canSuggest(text)) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted(moveActive(active, event.key === "ArrowDown" ? 1 : -1, options.length));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === "Escape") {
      close();
    }
  }

  return {
    text, options, active, pick, close, onKeyDown,
    showList: open && canSuggest(text),
    status: typing || state.status === "loading" ? "loading" as const : state.status,
    openList: () => setOpen(true),
    type: (value: string) => { setText(value); setOpen(true); setHighlighted(-1); },
  };
}
