import { useMemo, useState } from "react";

// Phân trang phía client, dùng cho danh sách đã tải đủ về (ví dụ danh sách chuyên khoa, bác sĩ)
export function usePagination<T>(items: T[], pageSize = 10) {
  const [requestedPage, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Tự lùi về trang cuối khi danh sách ngắn lại (ví dụ sau khi xoá phần tử)
  const page = Math.min(requestedPage, totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return { pageItems, page, totalPages, setPage };
}