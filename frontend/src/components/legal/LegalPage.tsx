import { LEGAL_DRAFT_NOTICE, type LegalDocument } from "@/data/legal";

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <main id="main-content" className="legal-page">
      <article className="container legal-article">
        <h1>{document.title}</h1>
        <p className="legal-updated">Cập nhật: {document.updated}</p>
        <p className="legal-draft" role="note">{LEGAL_DRAFT_NOTICE}</p>
        {document.sections.map(section => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
      </article>
    </main>
  );
}
