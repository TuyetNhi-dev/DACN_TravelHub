import { Icon } from "./Icon";

const MAX_STARS = 5;

/**
 * Hotel star class only. The API exposes no guest review scores, so none are ever shown.
 */
export function StarRating({ stars }: { stars: number | null }) {
  if (stars === null || stars <= 0) return null;
  const count = Math.min(Math.round(stars), MAX_STARS);
  return (
    <span className="ui-stars" role="img" aria-label={`Khách sạn ${count} sao`}>
      {Array.from({ length: count }, (_, index) => <Icon key={index} name="star" size={14} />)}
    </span>
  );
}

const SCORE_MAX = 5;

/** A guest review score. Only for clearly labelled sample reviews: the API has no review data. */
export function ReviewScore({ score }: { score: number }) {
  const rounded = Math.round(Math.min(Math.max(score, 0), SCORE_MAX));
  return (
    <span className="ui-review-score" role="img" aria-label={`Chấm ${rounded} trên ${SCORE_MAX} sao`}>
      {Array.from({ length: SCORE_MAX }, (_, index) => (
        <span key={index} className={index < rounded ? "is-on" : undefined}><Icon name="star" size={16} /></span>
      ))}
    </span>
  );
}
