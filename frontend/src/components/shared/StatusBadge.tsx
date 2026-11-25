// Nhãn trạng thái lịch hẹn. Luôn có chữ kèm màu để không phụ thuộc vào màu sắc.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "ui-badge--pending" },
  confirmed: { label: "Đã xác nhận", className: "ui-badge--confirmed" },
  completed: { label: "Hoàn thành", className: "ui-badge--completed" },
  cancelled: { label: "Đã huỷ", className: "ui-badge--cancelled" },
};

// Dùng cho ô chọn lọc theo trạng thái
export const APPOINTMENT_STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "ui-badge--unknown" };
  return <span className={`ui-badge ${cfg.className}`}>{cfg.label}</span>;
}