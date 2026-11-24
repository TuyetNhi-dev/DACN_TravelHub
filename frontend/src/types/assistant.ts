/** Mirrors TravelHub.Api.Features.Assistant DTOs (POST /api/assistant/chat). */
import type { TourSummary } from "@/types/tour";

export type AssistantRole = "user" | "assistant";

/** A line sent back with the next question; the server keeps no history. */
export interface AssistantHistoryItem {
  role: AssistantRole;
  text: string;
}

export interface AssistantSource {
  title: string;
  url: string;
}

/** Tours come from the catalogue search the model asked for: prices and dates are system data, not model text. */
export interface AssistantReply {
  reply: string;
  tours: TourSummary[];
  sources: AssistantSource[];
}

/** One bubble of the panel. */
export interface AssistantLine {
  id: number;
  role: AssistantRole;
  text: string;
  tours: TourSummary[];
  sources: AssistantSource[];
}
