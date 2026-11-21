"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { PROJECT_NOTICE } from "@/components/content/ContentPage";
import { Icon } from "@/components/ui/Icon";
import { FAQ_GROUPS, HELP_CONTACT, HELP_UPDATED } from "@/data/help-faq";
import { filterFaq } from "@/lib/content-search";

/** FAQ grouped by topic, filtered as you type; every answer is a native <details> (works without JavaScript). */
export function HelpPage() {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const groups = filterFaq(FAQ_GROUPS, query);
  const count = groups.reduce((total, group) => total + group.items.length, 0);
  return (
    <main id="main-content" className="content-page">
      <div className="container help-layout">
        <header className="content-head">
          <h1>Trợ giúp & câu hỏi thường gặp</h1>
          <p className="content-updated">Cập nhật: {HELP_UPDATED}</p>
          <p className="content-notice" role="note">{PROJECT_NOTICE}</p>
        </header>
        <div className="help-search" role="search">
          <label htmlFor={inputId}>Tìm câu hỏi</label>
          <span className="help-search-box">
            <Icon name="search" size={18} />
            <input id={inputId} type="search" value={query} onChange={event => setQuery(event.target.value)}
              placeholder="Ví dụ: hủy đơn, giữ chỗ, mã OTP" maxLength={100} />
          </span>
          <p aria-live="polite">{query.trim() ? `${count} câu hỏi phù hợp` : `${count} câu hỏi`}</p>
        </div>
        {groups.length === 0 && (
          <p className="help-empty">Không tìm thấy câu hỏi phù hợp. Thử từ khóa khác hoặc liên hệ tổng đài bên dưới.</p>
        )}
        {groups.map(group => (
          <section key={group.id} id={group.id} className="help-group" aria-labelledby={`${group.id}-title`}>
            <h2 id={`${group.id}-title`}>{group.title}</h2>
            {group.items.map(item => (
              <details key={item.id} id={item.id} className="help-item">
                <summary>{item.question}</summary>
                {item.answer.map(line => <p key={line}>{line}</p>)}
              </details>
            ))}
          </section>
        ))}
        <section id="lien-he" className="help-contact" aria-labelledby="lien-he-title">
          <h2 id="lien-he-title">{HELP_CONTACT.heading}</h2>
          {HELP_CONTACT.lines.map(line => <p key={line}>{line}</p>)}
          <p>Xem thêm: <Link href="/huy-va-hoan-tien">Chính sách hủy & hoàn tiền</Link>.</p>
        </section>
      </div>
    </main>
  );
}
