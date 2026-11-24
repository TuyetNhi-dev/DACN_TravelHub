import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { AssistantLine } from "@/types/assistant";
import { AssistantTourCard } from "./AssistantTourCard";

/** One bubble. The model's text is rendered as plain text (never HTML), cards and links from the API. */
export function AssistantMessage({ line, onNavigate }: { line: AssistantLine; onNavigate: () => void }) {
  if (line.role === "user") {
    return <li className="assistant-line is-user"><p className="assistant-bubble">{line.text}</p></li>;
  }
  return (
    <li className="assistant-line is-assistant">
      <span className="assistant-avatar" aria-hidden="true"><Icon name="compass" size={16} /></span>
      <div className="assistant-reply">
        <p className="assistant-bubble"><span className="sr-only">Trợ lý: </span>{line.text}</p>
        {line.tours.length > 0 && (
          <>
            <ul className="assistant-tours" aria-label="Tour gợi ý">
              {line.tours.map(tour => <AssistantTourCard key={tour.id} tour={tour} onOpen={onNavigate} />)}
            </ul>
            <p className="assistant-fine">Giá và lịch trên thẻ lấy trực tiếp từ hệ thống SàiHành.</p>
          </>
        )}
        {line.sources.length > 0 && (
          <ul className="assistant-sources" aria-label="Nguồn trên website">
            {line.sources.map(source => (
              <li key={source.url}>
                <Link href={source.url} onClick={onNavigate}><Icon name="book" size={13} />{source.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
