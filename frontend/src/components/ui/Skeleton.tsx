/** Placeholder blocks with a shimmer sweep (static under prefers-reduced-motion). */
export function Skeleton({ className }: { className?: string }) {
  return <span className={`ui-skeleton${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

/** Card-shaped placeholders for a grid or carousel that is still loading. */
export function CardSkeletons({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div className="ui-card-skeletons" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="ui-card ui-card-skeleton" aria-hidden="true">
          <Skeleton className="ui-skeleton--media" />
          <div className="ui-card-skeleton-body">
            <Skeleton className="ui-skeleton--short" />
            <Skeleton />
            <Skeleton className="ui-skeleton--mid" />
          </div>
        </div>
      ))}
    </div>
  );
}
