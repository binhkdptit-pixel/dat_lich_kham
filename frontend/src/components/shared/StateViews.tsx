export function LoadingState({ message = "Đang tải dữ liệu..." }: { message?: string }) {
  return (
    <div className="ui-state" role="status">
      <span className="ui-spinner" aria-hidden="true" />
      {message}
    </div>
  );
}

export function EmptyState({ message = "Chưa có dữ liệu" }: { message?: string }) {
  return <div className="ui-state ui-state--empty">{message}</div>;
}