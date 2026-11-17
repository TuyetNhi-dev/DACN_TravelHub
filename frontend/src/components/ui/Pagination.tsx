interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label: string;
}

export function Pagination({ page, pageCount, onChange, label }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <nav className="pagination" aria-label={label}>
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Trước</button>
      {pages.map(value => (
        <button
          type="button"
          key={value}
          className={value === page ? "active" : ""}
          aria-current={value === page ? "page" : undefined}
          onClick={() => onChange(value)}
        >
          {value}
        </button>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Sau</button>
    </nav>
  );
}
