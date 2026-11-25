import { ReactNode } from "react";
import { EmptyState, LoadingState } from "./StateViews";

export interface Column<T> {
  key: string;
  header: string;
  // Nếu không truyền render, bảng sẽ hiển thị giá trị row[key]
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyText = "Chưa có dữ liệu",
}: DataTableProps<T>) {
  if (loading) return <LoadingState />;
  if (rows.length === 0) return <EmptyState message={emptyText} />;

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render
                    ? c.render(row)
                    : String((row as unknown as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}