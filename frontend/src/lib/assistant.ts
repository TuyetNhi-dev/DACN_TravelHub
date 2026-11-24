/** Pure rules of the assistant panel. Limits mirror AssistantRules on the server, which checks them again. */
import type { AssistantHistoryItem, AssistantLine } from "@/types/assistant";

export const MAX_MESSAGE_LENGTH = 500;
/** Lines sent back with each question (AssistantRules.MaxHistoryItems). */
export const MAX_HISTORY_ITEMS = 6;
/** Longest assistant line the server accepts back (AssistantRules.MaxAssistantLineLength). */
const MAX_ASSISTANT_LINE = 1500;
/** Problem JSON "code" of a 503 from the assistant (AssistantService.UnavailableCode). */
export const UNAVAILABLE_CODE = "assistant_unavailable";

export const ASSISTANT_SUGGESTIONS = [
  "Tour Tết 3 ngày từ Sài Gòn dưới 5 triệu",
  "Chính sách hủy tour",
  "Đi Đà Lạt tháng 12",
] as const;

export function canSend(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH;
}

/** The last lines of the conversation, in the shape and limits the server accepts. */
export function buildHistory(lines: readonly AssistantLine[]): AssistantHistoryItem[] {
  return lines.slice(-MAX_HISTORY_ITEMS).map(line => ({
    role: line.role,
    text: line.role === "assistant" ? line.text.slice(0, MAX_ASSISTANT_LINE) : line.text,
  }));
}

/** Plain tour search for the same words: the fallback when the assistant is unavailable. */
export function searchHref(text: string): string {
  const query = text.trim().slice(0, 100);
  return query ? `/tours?${new URLSearchParams({ q: query })}` : "/tours";
}

/** "123/500", shown under the box once the question gets long. */
export function lengthHint(text: string): string | null {
  return text.length >= MAX_MESSAGE_LENGTH * 0.8 ? `${text.length}/${MAX_MESSAGE_LENGTH}` : null;
}
