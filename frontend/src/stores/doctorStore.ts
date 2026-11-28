import { create } from "zustand";
import api from "../api/axios";
import type { Doctor } from "../types";

interface DoctorState {
  items: Doctor[];
  loading: boolean;
  fetchAll: (specialtyId?: string) => Promise<void>;
}

// Bộ đếm để bỏ qua kết quả cũ khi người dùng đổi bộ lọc liên tục
let latestRequest = 0;

export const useDoctorStore = create<DoctorState>((set) => ({
  items: [],
  loading: false,
  fetchAll: async (specialtyId) => {
    const requestId = ++latestRequest;
    set({ loading: true });
    try {
      const { data } = await api.get<Doctor[]>("/doctors", {
        params: specialtyId ? { specialty: specialtyId } : undefined,
      });
      if (requestId === latestRequest) set({ items: data });
    } finally {
      if (requestId === latestRequest) set({ loading: false });
    }
  },
}));