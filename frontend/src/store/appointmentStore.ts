import { create } from "zustand";
import api from "../api/axios";
import { MOCK_DOCTORS, USE_MOCK } from "../api/booking";
import {
  AppointmentItem,
  AppointmentStatus,
  errorMessage,
  toAppointmentItem,
} from "../types/appointment";

export interface BookPayload {
  doctor: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  reason: string;
  phone?: string;
}

interface AppointmentState {
  list: AppointmentItem[];
  loading: boolean;
  error: string | null;
  fetchMy: (status?: AppointmentStatus) => Promise<void>;
  book: (payload: BookPayload) => Promise<void>;
  update: (
    id: string,
    payload: Partial<Pick<BookPayload, "date" | "timeSlot" | "reason">>,
  ) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

// dữ liệu giả (chỉ dùng khi VITE_USE_MOCK=true)
// cho phép làm và thử trang "Lịch hẹn của tôi" khi API thật chưa có.
// dữ liệu nằm trong bộ nhớ
const dayFromToday = (n: number) => {
  const d = new Date(Date.now() + 7 * 3600 * 1000); // giờ Việt Nam
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

let mockList: AppointmentItem[] = [
  {
    _id: "m1",
    doctor: MOCK_DOCTORS[0],
    date: dayFromToday(1),
    timeSlot: "08:00",
    reason: "Đau đầu kéo dài",
    status: "pending",
  },
  {
    _id: "m2",
    doctor: MOCK_DOCTORS[1],
    date: dayFromToday(2),
    timeSlot: "09:30",
    reason: "Khám định kỳ cho bé",
    status: "confirmed",
  },
  {
    _id: "m3",
    doctor: MOCK_DOCTORS[0],
    date: dayFromToday(-3),
    timeSlot: "14:00",
    reason: "Tái khám",
    status: "completed",
    result: "Sức khoẻ ổn định, tái khám sau 3 tháng.",
  },
  {
    _id: "m4",
    doctor: MOCK_DOCTORS[2],
    date: dayFromToday(3),
    timeSlot: "10:00",
    reason: "Mệt mỏi",
    status: "cancelled",
  },
];

// ném lỗi có cùng hình dạng với lỗi của axios để errorMessage() đọc được như lỗi thật
const mockError = (message: string) => ({
  response: { status: 409, data: { message } },
});

const findMock = (id: string) => {
  const item = mockList.find((a) => a._id === id);
  if (!item) throw mockError("Không tìm thấy lịch hẹn");
  return item;
};

// Zustand giữ dữ liệu danh sách lịch hẹn
export const useAppointmentStore = create<AppointmentState>((set) => ({
  list: [],
  loading: false,
  error: null,

  fetchMy: async (status) => {
    if (USE_MOCK) {
      const rows = mockList
        .filter((a) => !status || a.status === status)
        .sort((a, b) =>
          (b.date + b.timeSlot).localeCompare(a.date + a.timeSlot),
        );
      set({ list: rows, loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/appointments/my", {
        params: status ? { status } : {},
      });
      set({ list: (data as any[]).map(toAppointmentItem), loading: false });
    } catch (e) {
      set({
        error: errorMessage(e, "Không tải được lịch hẹn"),
        loading: false,
      });
    }
  },

  // đặt lịch mới
  book: async (payload) => {
    if (USE_MOCK) {
      // chế độ dữ liệu giả: thêm vào danh sách giả để thấy ở trang "Lịch hẹn của tôi"
      const doctor =
        MOCK_DOCTORS.find((d) => d._id === payload.doctor) ?? MOCK_DOCTORS[0];
      mockList = [
        {
          _id: `m${Date.now()}`,
          doctor,
          date: payload.date,
          timeSlot: payload.timeSlot,
          reason: payload.reason,
          status: "pending",
          phone: payload.phone,
        },
        ...mockList,
      ];
      return;
    }
    await api.post("/appointments", payload);
  },

  // sửa ngày giờ or lí do
  update: async (id, payload) => {
    if (USE_MOCK) {
      const item = findMock(id);
      if (item.status !== "pending")
        throw mockError("Chỉ sửa được lịch đang chờ xác nhận");
      Object.assign(item, payload);
      return;
    }
    await api.put(`/appointments/${id}`, payload);
  },

  // hủy lịch và chuyển trạng thái sang "cancelled"
  cancel: async (id) => {
    if (USE_MOCK) {
      const item = findMock(id);
      if (item.status === "completed")
        throw mockError("Không thể huỷ lịch đã hoàn thành");
      if (item.status === "cancelled")
        throw mockError("Lịch hẹn đã được huỷ trước đó");
      item.status = "cancelled";
      return;
    }
    await api.patch(`/appointments/${id}/cancel`);
  },

  // xóa lịch
  remove: async (id) => {
    if (USE_MOCK) {
      const item = findMock(id);
      if (item.status !== "cancelled")
        throw mockError("Chỉ xoá được lịch đã huỷ");
      mockList = mockList.filter((a) => a._id !== id);
      return;
    }
    await api.delete(`/appointments/${id}`);
  },
}));
