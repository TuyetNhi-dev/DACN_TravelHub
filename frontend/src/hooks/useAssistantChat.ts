"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { UNAVAILABLE_CODE, buildHistory, canSend } from "@/lib/assistant";
import { askAssistant } from "@/services/assistant";
import type { AssistantLine } from "@/types/assistant";

const UNAVAILABLE_STATUS = 503;

/** "unavailable": no key or the model is down (503); "error": anything else, worth a retry. */
export interface AssistantFailure {
  kind: "unavailable" | "error";
  message: string;
  /** The question that failed: it goes back into the box instead of being lost. */
  question: string;
}

function toFailure(failure: unknown, question: string): AssistantFailure {
  if (failure instanceof ApiError && (failure.status === UNAVAILABLE_STATUS || failure.code === UNAVAILABLE_CODE))
    return { kind: "unavailable", message: "Trợ lý tạm không khả dụng.", question };
  const message = failure instanceof ApiError ? failure.message : "Chưa gửi được câu hỏi. Vui lòng thử lại.";
  return { kind: "error", message, question };
}

/** Conversation of the open panel. Lives in the browser only; each question carries the last few lines. */
export function useAssistantChat() {
  const [lines, setLines] = useState<AssistantLine[]>([]);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<AssistantFailure | null>(null);
  const nextId = useRef(0);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  async function send(text: string): Promise<boolean> {
    if (!canSend(text) || sending) return false;
    const question = text.trim();
    const history = buildHistory(lines);
    const asked: AssistantLine = { id: nextId.current++, role: "user", text: question, tours: [], sources: [] };
    setLines(current => [...current, asked]);
    setFailure(null);
    setSending(true);
    pending.current = new AbortController();
    try {
      const reply = await askAssistant(question, history, pending.current.signal);
      setLines(current => [...current, { id: nextId.current++, role: "assistant", text: reply.reply,
        tours: reply.tours, sources: reply.sources }]);
      return true;
    } catch (caught) {
      if (pending.current?.signal.aborted) return false;
      // The question is taken back out of the log: it returns to the box via failure.question.
      setLines(current => current.filter(line => line.id !== asked.id));
      setFailure(toFailure(caught, question));
      return false;
    } finally {
      setSending(false);
    }
  }

  function reset() {
    pending.current?.abort();
    setLines([]);
    setFailure(null);
    setSending(false);
  }

  return { lines, sending, failure, send, reset, dismissFailure: () => setFailure(null) };
}
