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
