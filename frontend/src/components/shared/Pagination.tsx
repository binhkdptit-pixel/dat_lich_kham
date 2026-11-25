interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="ui-pagination" aria-label="Phân trang">
      <button
        type="button"
        className="ui-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← Trước
      </button>
      <span>
        Trang {page} / {totalPages}
      </span>
      <button
        type="button"
        className="ui-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau →
      </button>
    </nav>
  );
}