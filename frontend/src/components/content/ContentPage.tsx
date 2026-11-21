import type { ReactNode } from "react";
import type { ContentDocument } from "@/types/content";

/** Shown on every policy-like page: the site is a student project and its data is simulated. */
export const PROJECT_NOTICE = "Website đồ án sinh viên HUTECH, không phải doanh nghiệp lữ hành thật. "
  + "Dữ liệu tour, giá và thông tin liên hệ là dữ liệu mô phỏng.";

interface ContentPageProps {
  document: ContentDocument;
  /** Extra blocks after the sections (team list, related links…). */
  children?: ReactNode;
}

/**
 * Long-form page: title, "Cập nhật" date, a table of contents (a folded list on phones, a sticky side list on
 * wide screens) and numbered sections with anchors.
 */
export function ContentPage({ document, children }: ContentPageProps) {
  return (
    <main id="main-content" className="content-page">
      <div className="container content-layout">
        <header className="content-head">
          <h1>{document.title}</h1>
          <p className="content-updated">Cập nhật: {document.updated}</p>
          <p className="content-notice" role="note">{PROJECT_NOTICE}</p>
          {document.intro && <p className="content-intro">{document.intro}</p>}
        </header>
        <TableOfContents document={document} />
        <article className="content-body">
          {document.sections.map(section => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.heading}</h2>
              {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          {children}
        </article>
      </div>
    </main>
  );
}

/**
 * Phones get a folded list (one tap away, not a screen of links before the text); wide screens a sticky side
 * list. CSS shows exactly one of the two.
 */
function TableOfContents({ document }: { document: ContentDocument }) {
  const links = (
    <ol>
      {document.sections.map(section => (
        <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>
      ))}
    </ol>
  );
  return (
    <>
      <nav className="content-toc content-toc--folded" aria-label="Mục lục">
        <details>
          <summary>Mục lục ({document.sections.length} mục)</summary>
          {links}
        </details>
      </nav>
      <nav className="content-toc content-toc--side" aria-label="Mục lục">
        <b>Mục lục</b>
        {links}
      </nav>
    </>
  );
}
