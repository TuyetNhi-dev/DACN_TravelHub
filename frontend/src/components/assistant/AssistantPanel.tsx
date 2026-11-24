"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { AssistantFailure, useAssistantChat } from "@/hooks/useAssistantChat";
import { ASSISTANT_SUGGESTIONS, searchHref } from "@/lib/assistant";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessage } from "./AssistantMessage";

export const ASSISTANT_PANEL_ID = "assistant-panel";
const INPUT_ID = "assistant-input";

interface AssistantPanelProps {
  open: boolean;
  chat: ReturnType<typeof useAssistantChat>;
  onClose: () => void;
}

/** Non-modal chat panel: the page stays usable beside it on desktop; on phones it fills the screen. */
export function AssistantPanel({ open, chat, onClose }: AssistantPanelProps) {
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.getElementById(INPUT_ID)?.focus();
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [chat.lines.length, chat.sending, chat.failure]);

  async function ask(text: string) {
    setDraft("");
    // A failed question comes back into the box (keep the user's input on error).
    if (!(await chat.send(text))) setDraft(current => current || text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") onClose();
  }

  return (
    <section id={ASSISTANT_PANEL_ID} className="assistant-panel" role="dialog" aria-modal="false"
      aria-labelledby="assistant-title" hidden={!open} onKeyDown={onKeyDown}>
      <PanelHeader canReset={chat.lines.length > 0} onReset={chat.reset} onClose={onClose} />
      <div className="assistant-log" ref={log} role="log" aria-live="polite" aria-relevant="additions">
        {chat.lines.length === 0 && !chat.sending && <Welcome onPick={text => void ask(text)} />}
        <ol className="assistant-lines">
          {chat.lines.map(line => <AssistantMessage key={line.id} line={line} onNavigate={onClose} />)}
        </ol>
        {chat.sending && <Typing />}
        {chat.failure && <FailureNotice failure={chat.failure} onNavigate={onClose} />}
      </div>
      <AssistantComposer inputId={INPUT_ID} value={draft} onChange={setDraft} onSubmit={text => void ask(text)}
        sending={chat.sending} />
    </section>
  );
}

function PanelHeader({ canReset, onReset, onClose }: {
  canReset: boolean;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <header className="assistant-head">
      <span className="assistant-avatar" aria-hidden="true"><Icon name="compass" size={18} /></span>
      <div>
        <h2 id="assistant-title">Trợ lý SàiHành</h2>
        <p>Thử nghiệm · tư vấn tour và chính sách</p>
      </div>
      {canReset && (
        <button type="button" className="assistant-icon-btn" onClick={onReset} aria-label="Bắt đầu cuộc trò chuyện mới">
          <Icon name="plus" size={18} />
        </button>
      )}
      <button type="button" className="assistant-icon-btn" onClick={onClose} aria-label="Đóng trợ lý">
        <Icon name="close" size={18} />
      </button>
    </header>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="assistant-welcome">
      <p>
        <strong>Xin chào!</strong> Mình gợi ý tour trong nước của SàiHành và giải đáp chính sách, thanh toán, hủy đơn.
      </p>
      <p className="assistant-suggest-label">Thử hỏi:</p>
      <ul className="assistant-suggestions">
        {ASSISTANT_SUGGESTIONS.map(text => (
          <li key={text}><button type="button" onClick={() => onPick(text)}>{text}</button></li>
        ))}
      </ul>
    </div>
  );
}

function Typing() {
  return (
    <p className="assistant-typing" role="status">
      <span aria-hidden="true"><i /><i /><i /></span>Trợ lý đang trả lời…
    </p>
  );
}

function FailureNotice({ failure, onNavigate }: { failure: AssistantFailure; onNavigate: () => void }) {
  return (
    <div className={`assistant-failure is-${failure.kind}`} role="alert">
      <Icon name="alert" size={18} />
      <div>
        <p><strong>{failure.message}</strong></p>
        {failure.kind === "unavailable" ? (
          <p>
            Bạn vẫn có thể{" "}
            <Link href={searchHref(failure.question)} onClick={onNavigate}>tìm tour bằng tìm kiếm thường</Link>
            {" "}hoặc xem <Link href="/tro-giup" onClick={onNavigate}>trang Trợ giúp</Link>.
          </p>
        ) : <p>Câu hỏi vẫn nằm trong ô bên dưới, bấm gửi để thử lại.</p>}
      </div>
    </div>
  );
}
