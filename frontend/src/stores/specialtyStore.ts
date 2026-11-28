import { create } from "zustand";
import api from "../api/axios";
import type { Specialty } from "../types";

interface SpecialtyState {
  items: Specialty[];
  loaded: boolean;
  loading: boolean;
  // Chỉ tải lại từ server khi chưa có dữ liệu, hoặc khi truyền force = true
  fetchAll: (force?: boolean) => Promise<void>;
}

export const useSpecialtyStore = create<SpecialtyState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  fetchAll: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const { data } = await api.get<Specialty[]>("/specialties");
      set({ items: data, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));