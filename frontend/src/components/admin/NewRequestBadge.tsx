const MAX_SHOWN = 99;

/** "3" pill after the "Yêu cầu dịch vụ" link; screen readers hear ", 3 yêu cầu mới". */
export function NewRequestBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="admin-nav-badge">
      <span aria-hidden="true">{count > MAX_SHOWN ? `${MAX_SHOWN}+` : count}</span>
      <span className="sr-only">, {count} yêu cầu mới</span>
    </span>
  );
}
