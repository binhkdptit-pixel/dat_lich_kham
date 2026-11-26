import { useEffect, useState } from "react";
import "../../components/booking/booking.css";
import {
  APPOINTMENT_STATUS_OPTIONS,
  Column,
  ConfirmModal,
  DataTable,
  Pagination,
  StatusBadge,
  usePagination,
  useToast,
} from "../../components/shared";
import { fetchSlots } from "../../api/booking";
import { useAppointmentStore } from "../../store/appointmentStore";
import {
  AppointmentItem,
  AppointmentStatus,
  errorMessage,
  todayVN,
} from "../../types/appointment";

const FILTERS = [{ value: "", label: "Tất cả" }, ...APPOINTMENT_STATUS_OPTIONS];

type Action = { kind: "cancel" | "remove" | "edit"; item: AppointmentItem };
type EditPayload = { date?: string; timeSlot?: string; reason?: string };

// Hộp thoại sửa lịch (ConfirmModal của B chỉ có câu hỏi, không có ô nhập, nên form sửa tự làm)
function EditDialog({
  item,
  busy,
  onSave,
  onClose,
}: {
  item: AppointmentItem;
  busy: boolean;
  onSave: (payload: EditPayload) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(item.date);
  const [slot, setSlot] = useState(item.timeSlot);
  const [reason, setReason] = useState(item.reason);
  const [slots, setSlots] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  // Đổi ngày --> tải khung giờ trống của bác sĩ ngày đó
  useEffect(() => {
    if (!date) return;
    let alive = true; // bỏ qua kết quả nếu hộp thoại đã đóng hoặc đã đổi ngày
    fetchSlots(item.doctor._id, date)
      .then((s) => {
        if (!alive) return;
        // Giờ hiện tại của chính lịch này đang "bận" nên API không trả: thêm lại nếu vẫn cùng ngày
        const own = date === item.date ? [item.timeSlot] : [];
        setSlots(Array.from(new Set([...own, ...s])).sort());
      })
      .catch(() => {
        if (alive) setSlots([]);
      });
    return () => {
      alive = false;
    };
  }, [date]);

  const save = () => {
    if (!slot) return setMsg("Hãy chọn giờ khám");
    if (!reason.trim()) return setMsg("Lý do khám không được để trống");
    // Chỉ gửi những trường thật sự đổi
    const payload: EditPayload = {};
    if (date !== item.date) payload.date = date;
    if (slot !== item.timeSlot) payload.timeSlot = slot;
    if (reason.trim() !== item.reason) payload.reason = reason.trim();
    if (Object.keys(payload).length === 0) return onClose();
    onSave(payload);
  };

  return (
    <div className="bk-overlay" onClick={() => !busy && onClose()}>
      <div
        className="bk-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Sửa lịch hẹn</h3>
        <p>
          Bác sĩ: <b>{item.doctor.name}</b>
        </p>
        {msg && <div className="bk-toast err">{msg}</div>}
        <div className="bk-field">
          <label htmlFor="e-date">Ngày khám</label>
          <input
            id="e-date"
            type="date"
            min={todayVN()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot(""); // đổi ngày thì phải chọn lại giờ
              setMsg("");
            }}
          />
        </div>
        <div className="bk-field">
          <label htmlFor="e-slot">Giờ khám</label>
          <select
            id="e-slot"
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value);
              setMsg("");
            }}
          >
            <option value="">-- Chọn giờ --</option>
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="bk-field">
          <label htmlFor="e-reason">Lý do khám</label>
          <textarea
            id="e-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setMsg("");
            }}
          />
        </div>
        <div className="bk-actions">
          <button
            type="button"
            className="ui-btn"
            onClick={onClose}
            disabled={busy}
          >
            Đóng
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Đang xử lý..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientAppointments() {
  const { list, loading, error, fetchMy, update, cancel, remove } =
    useAppointmentStore();
  const toast = useToast();
  const [filter, setFilter] = useState<AppointmentStatus | "">("");
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  // Phân trang phía client: 8 lịch hẹn mỗi trang
  const { pageItems, page, totalPages, setPage } = usePagination(list, 8);

  const reload = () => fetchMy(filter || undefined);
  useEffect(() => {
    reload();
  }, [filter]);

  // Chạy một thao tác ghi: báo toast thành công/thất bại, đóng hộp thoại rồi tải lại danh sách.
  // Tải lại cả khi lỗi vì trạng thái có thể vừa đổi (ví dụ bác sĩ vừa xác nhận lịch).
  const run = async (fn: () => Promise<void>, okText: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okText);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      setAction(null);
    }
    await reload();
  };

  const columns: Column<AppointmentItem>[] = [
    {
      key: "doctor",
      header: "Bác sĩ",
      render: (a) => (
        <>
          {a.doctor.name}
          <br />
          <small>{a.doctor.specialty}</small>
        </>
      ),
    },
    { key: "date", header: "Ngày" },
    { key: "timeSlot", header: "Giờ" },
    {
      key: "reason",
      header: "Lý do",
      render: (a) => (
        <>
          {a.reason}
          {a.result && (
            <>
              <br />
              <small>
                <b>Kết quả khám:</b> {a.result}
              </small>
            </>
          )}
        </>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (a) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {a.status === "pending" && (
            <button
              type="button"
              className="ui-btn"
              onClick={() => setAction({ kind: "edit", item: a })}
            >
              Sửa
            </button>
          )}
          {(a.status === "pending" || a.status === "confirmed") && (
            <button
              type="button"
              className="ui-btn ui-btn--danger"
              onClick={() => setAction({ kind: "cancel", item: a })}
            >
              Huỷ
            </button>
          )}
          {a.status === "cancelled" && (
            <button
              type="button"
              className="ui-btn ui-btn--danger"
              onClick={() => setAction({ kind: "remove", item: a })}
            >
              Xoá
            </button>
          )}
        </div>
      ),
    },
  ];

  const target = action?.item;

  return (
    <>
      <h2>Lịch hẹn của tôi</h2>

      <div className="bk-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`bk-tab ${filter === f.value ? "active" : ""}`}
            onClick={() => {
              setFilter(f.value as AppointmentStatus | "");
              setPage(1); // đổi bộ lọc thì về trang đầu
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="bk-toast err">{error}</div>}

      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(a) => a._id}
        loading={loading}
        emptyText="Bạn chưa có lịch hẹn nào."
      />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Huỷ và xoá đều phải xác nhận (yêu cầu của đề) */}
      <ConfirmModal
        open={action?.kind === "cancel"}
        title="Huỷ lịch hẹn?"
        message={
          target
            ? `Bạn muốn huỷ lịch khám với ${target.doctor.name} lúc ${target.timeSlot} ngày ${target.date}?`
            : ""
        }
        confirmText="Huỷ lịch"
        cancelText="Đóng"
        danger
        loading={busy}
        onConfirm={() =>
          target && run(() => cancel(target._id), "Đã huỷ lịch hẹn")
        }
        onCancel={() => setAction(null)}
      />
      <ConfirmModal
        open={action?.kind === "remove"}
        title="Xoá lịch hẹn?"
        message="Lịch đã huỷ sẽ bị xoá vĩnh viễn, không thể khôi phục."
        confirmText="Xoá"
        cancelText="Đóng"
        danger
        loading={busy}
        onConfirm={() =>
          target && run(() => remove(target._id), "Đã xoá lịch hẹn")
        }
        onCancel={() => setAction(null)}
      />

      {action?.kind === "edit" && (
        <EditDialog
          item={action.item}
          busy={busy}
          onSave={(payload) =>
            run(() => update(action.item._id, payload), "Đã cập nhật lịch hẹn")
          }
          onClose={() => setAction(null)}
        />
      )}
    </>
  );
}
