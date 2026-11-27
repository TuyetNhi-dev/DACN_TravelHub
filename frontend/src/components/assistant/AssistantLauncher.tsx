"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { ASSISTANT_PANEL_ID, AssistantPanel } from "./AssistantPanel";
import "@/styles/assistant.css";

/**
 * Floating button + panel on every customer page. The panel is mounted on first open and then only hidden, so the
 * conversation survives closing it; it is lost on reload because nothing is stored.
 */
export function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const chat = useAssistantChat();

  function toggle() {
    setMounted(true);
    setOpen(current => !current);
  }

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  return (
    <>
      {mounted && <AssistantPanel open={open} chat={chat} onClose={close} />}
      <button ref={button} type="button" className={open ? "assistant-fab is-open" : "assistant-fab"} onClick={toggle}
        aria-expanded={open} aria-controls={mounted ? ASSISTANT_PANEL_ID : undefined}
        aria-label={open ? "Đóng trợ lý" : "Mở trợ lý tư vấn"}>
        <Icon name={open ? "close" : "chat"} size={22} />
        <span className="assistant-fab-label">Trợ lý</span>
      </button>
    </>
  );
}
