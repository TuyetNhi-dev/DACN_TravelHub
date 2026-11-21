import Image from "next/image";
import Link from "next/link";
import { PROJECT_NOTICE } from "@/components/content/ContentPage";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { TravelGuide } from "@/data/travel-guides";
import { getDestinationImages } from "@/lib/media";
import { GuideRelatedTours } from "./GuideRelatedTours";

export function GuideArticle({ guide }: { guide: TravelGuide }) {
  const cover = getDestinationImages(guide.coverPlace)[0];
  return (
    <main id="main-content" className="content-page">
      <div className="container content-layout">
        <header className="content-head">
          <Breadcrumb items={[{ label: "Cẩm nang du lịch", href: "/cam-nang" }, { label: guide.title }]} />
          <h1>{guide.title}</h1>
          <p className="content-updated">Cập nhật: {guide.updated}</p>
          <p className="content-intro">{guide.summary}</p>
          {cover && (
            <figure className="guide-cover">
              <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 900px) 100vw, 760px" />
              {cover.illustrative && <figcaption>Ảnh minh họa</figcaption>}
            </figure>
          )}
        </header>
        <nav className="content-toc content-toc--side" aria-label="Mục lục">
          <b>Mục lục</b>
          <ol>{guide.sections.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}</ol>
        </nav>
        <article className="content-body">
          {guide.sections.map(section => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.heading}</h2>
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.tips && (
                <div className="guide-tips">
                  <b>Mẹo nhỏ</b>
                  <ul>{section.tips.map(tip => <li key={tip}>{tip}</li>)}</ul>
                </div>
              )}
            </section>
          ))}
          <p className="content-notice" role="note">{PROJECT_NOTICE}</p>
          <GuideRelatedTours keywords={guide.relatedKeywords} />
          <Link className="btn btn-outline guide-back" href="/cam-nang">← Xem các bài cẩm nang khác</Link>
        </article>
      </div>
    </main>
  );
}
