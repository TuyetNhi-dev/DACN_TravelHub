import { Icon } from "@/components/ui/Icon";
import { ReviewScore } from "@/components/ui/Rating";
import { SAMPLE_REVIEWS } from "@/data/testimonials";

/** Sample reviews only (see data/testimonials.ts); the note above the list says so in plain words. */
export function HomeTestimonials() {
  return (
    <>
      <p className="review-sample-note" role="note">
        <Icon name="alert" size={16} />
        Đánh giá mô phỏng do nhóm đồ án viết để minh họa giao diện, không phải ý kiến của khách hàng thật.
      </p>
      <ul className="review-grid">
        {SAMPLE_REVIEWS.map(review => (
          <li key={review.id} className="review-card" data-reveal-item>
            <span className="review-quote" aria-hidden="true"><Icon name="quote" size={28} /></span>
            {/* On every card, so a cropped screenshot of one review still says it is not a real customer. */}
            <span className="review-sample-badge">Nội dung minh họa</span>
            <ReviewScore score={review.score} />
            <blockquote><p>{review.text}</p></blockquote>
            <p className="review-author"><b>{review.author}</b><span>{review.trip}</span></p>
          </li>
        ))}
      </ul>
    </>
  );
}
