"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useResource } from "@/hooks/useResource";
import { canSuggest } from "@/lib/tour-suggest";
import { getTourSuggestions } from "@/services/tours";

const TYPING_DELAY_MS = 250;

/** Suggestions for the text once typing pauses; nothing is requested for one letter or less. */
export function useTourSuggestions(text: string) {
  const settled = useDebouncedValue(text.trim(), TYPING_DELAY_MS);
  const key = canSuggest(settled) ? `tour-suggest:${settled}` : null;
  const { state } = useResource(key, signal => getTourSuggestions(settled, signal));
  return { state, typing: settled !== text.trim() };
}
