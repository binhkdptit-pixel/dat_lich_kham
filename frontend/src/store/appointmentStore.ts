import { create } from "zustand";
import api from "../api/axios";
import { USE_MOCK } from "../api/booking";
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

// Zustand giữ dữ liệu danh sách lịch hẹn
export const useAppointmentStore = create<AppointmentState>((set) => ({
  list: [],
  loading: false,
  error: null,

  fetchMy: async (status) => {
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
    if (USE_MOCK) return; // chế độ dữ liệu giả: coi như đặt thành công
    await api.post("/appointments", payload);
  },

  // sửa ngày giờ or lí do
  update: async (id, payload) => {
    await api.put(`/appointments/${id}`, payload);
  },

  // hủy lịch và chuyển trạng thái sang "cancelled"
  cancel: async (id) => {
    await api.patch(`/appointments/${id}/cancel`);
  },

  // xóa lịch
  remove: async (id) => {
    await api.delete(`/appointments/${id}`);
  },
}));
