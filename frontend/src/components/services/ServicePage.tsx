import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Icon } from "@/components/ui/Icon";
import type { ExtraService } from "@/data/extra-services";
import { ServiceRequestForm } from "./ServiceRequestForm";

/** /dich-vu/<slug>: introduction, highlights and FAQ on the left, the consultation form on the right. */
export function ServicePage({ service }: { service: ExtraService }) {
  return (
    <main id="main-content" className="svc-page">
      <header className="svc-hero">
        <div className="container">
          <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: service.name }]} />
          <div className="svc-hero-title">
            <span className={`svc-tile svc-tone--${service.tone}`} aria-hidden="true"><Icon name={service.icon} size={28} /></span>
            <div>
              <span className="ui-eyebrow">Dịch vụ cộng thêm</span>
              <h1>{service.name}</h1>
            </div>
          </div>
          <p className="svc-lead">{service.lead}</p>
        </div>
      </header>

      <div className="container svc-layout">
        <article className="svc-content">
          <section aria-labelledby="svc-intro-title">
            <h2 id="svc-intro-title">Giới thiệu</h2>
            {service.intro.map(paragraph => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
          </section>
          <section aria-labelledby="svc-highlights-title">
            <h2 id="svc-highlights-title">Điểm nổi bật</h2>
            <ul className="svc-highlights">
              {service.highlights.map(item => (
                <li key={item.title}>
                  <span className={`svc-check svc-tone--${service.tone}`} aria-hidden="true"><Icon name="check" size={16} /></span>
                  <div><h3>{item.title}</h3><p>{item.text}</p></div>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="svc-faq-title">
            <h2 id="svc-faq-title">Câu hỏi thường gặp</h2>
            <div className="svc-faq">
              {service.faqs.map(item => (
                <details key={item.question}>
                  <summary>{item.question}<Icon name="chevron" size={18} /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </article>
        <aside className="svc-aside" aria-label="Gửi yêu cầu tư vấn">
          <ServiceRequestForm type={service.type} />
        </aside>
      </div>
    </main>
  );
}
