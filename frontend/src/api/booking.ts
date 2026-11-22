import api from "./axios";
import { DoctorLite, Specialty, toDoctorLite } from "../types/appointment";

// Bật dữ liệu giả khi API của A/B/D chưa có: đặt VITE_USE_MOCK=true trong frontend/.env
// Khi các API thật đã chạy: xoá dòng đó (hoặc để false) là xong, không phải sửa code.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const MOCK_SPECIALTIES: Specialty[] = [
  { _id: "sp1", name: "Nội tổng quát" },
  { _id: "sp2", name: "Nhi khoa" },
];
const MOCK_DOCTORS: DoctorLite[] = [
  {
    _id: "d1",
    name: "BS. Phạm Quốc Dũng",
    specialty: "Nội tổng quát",
    specialtyId: "sp1",
  },
  {
    _id: "d2",
    name: "BS. Hoàng Thu Hà",
    specialty: "Nhi khoa",
    specialtyId: "sp2",
  },
  {
    _id: "d3",
    name: "BS. Đỗ Gia Huy",
    specialty: "Nội tổng quát",
    specialtyId: "sp1",
  },
];
const MOCK_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "13:30",
  "14:00",
  "14:30",
];
// fetchSpecialties --> trả thẳng data từ API
export async function fetchSpecialties(): Promise<Specialty[]> {
  if (USE_MOCK) return MOCK_SPECIALTIES;
  const { data } = await api.get("/specialties"); // API của B
  return data;
}
// fetchDoctors --> dữ liệu từ API được chuẩn hoá qua toDoctorLite
// lấy hết bác sĩ rồi lọc phía client
export async function fetchDoctors(): Promise<DoctorLite[]> {
  if (USE_MOCK) return MOCK_DOCTORS;
  const { data } = await api.get("/doctors");
  return (data as any[]).map(toDoctorLite);
}

// khung giờ còn trống --> trả { slots: ["08:00", ...] }
// ngày truyền vào có dạng YYYY-MM-DD, cùng định dạng với AppointmentItem.date và todayVN().
export async function fetchSlots(
  doctorId: string,
  date: string,
): Promise<string[]> {
  if (USE_MOCK) return MOCK_SLOTS;
  const { data } = await api.get(`/doctors/${doctorId}/slots`, {
    params: { date },
  });
  return data.slots;
}
