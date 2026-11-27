import { apiPost } from "@/lib/api-client";
import { itemEnvelope, list, str, type Row } from "@/lib/decode";
import { decodeTour } from "@/services/tours";
import type { AssistantHistoryItem, AssistantReply } from "@/types/assistant";

const RESOURCE = "trợ lý";

function decodeReply(row: Row): AssistantReply {
  return {
    reply: str(row, "reply", RESOURCE),
    tours: list(row.tours, decodeTour, RESOURCE),
    sources: list(row.sources, s => ({ title: str(s, "title", RESOURCE), url: str(s, "url", RESOURCE) }), RESOURCE),
  };
}

/** One question with the recent lines; the server stores nothing. */
export async function askAssistant(message: string, history: AssistantHistoryItem[],
  signal?: AbortSignal): Promise<AssistantReply> {
  return itemEnvelope(await apiPost("/api/assistant/chat", { message, history }, signal), decodeReply, RESOURCE);
}
