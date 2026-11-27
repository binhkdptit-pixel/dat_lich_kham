// Kiểu dữ liệu riêng của phần Đặt lịch

export type AppointmentStatus =
  | "pending" // chờ xác nhận
  | "confirmed" // đã xác nhận
  | "completed" // hoàn thành
  | "cancelled"; // đã hủy

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export interface Specialty {
  _id: string;
  name: string;
}

// Dạng bác sĩ đã chuẩn hoá. Backend hiện trả { name, specialty: "chuỗi" },
export interface DoctorLite {
  _id: string;
  name: string;
  specialty: string; // tên chuyên khoa
  specialtyId: string;
}

export function toDoctorLite(d: any): DoctorLite {
  const sp = d?.specialty;
  return {
    _id: d?._id ?? "",
    name: d?.user?.name ?? d?.name ?? "(chưa rõ tên)", // ưu tiên user.name, không có thì dùng name, không có nữa thì hiện "(chưa rõ tên)".
    specialty: typeof sp === "object" && sp ? (sp.name ?? "") : (sp ?? ""),
    specialtyId: typeof sp === "object" && sp ? (sp._id ?? "") : (sp ?? ""), // dấu ?. và ?? giúp hàm không bị crash khi thiếu dữ liệu.
  };
}
// kiểm tra bác sĩ có thuộc chuyên khoa không, so khớp theo _id hoặc theo tên
export const doctorInSpecialty = (d: DoctorLite, s: Specialty) =>
  d.specialtyId === s._id || d.specialty === s.name;

export interface AppointmentItem {
  _id: string;
  doctor: DoctorLite; // chuẩn hóa quaa toDoctorLite
  date: string; // YYYY-MM-DD
  timeSlot: string;
  reason: string;
  status: AppointmentStatus;
  result?: string;
  patientName?: string;
  phone?: string;
}

export function toAppointmentItem(a: any): AppointmentItem {
  return {
    _id: a._id,
    doctor: toDoctorLite(a.doctor),
    date: String(a.date).slice(0, 10), // API trả 00:00 UTC của ngày khám
    timeSlot: a.timeSlot,
    reason: a.reason ?? "",
    status: a.status,
    result: a.result,
    patientName: a.patientName,
    phone: a.phone,
  };
}

// Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD
export const todayVN = () =>
  new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); // hàm này dùng để chặn đặt lịch vào ngày đã qua.

export const errorMessage = (
  e: any,
  fallback = "Có lỗi xảy ra, vui lòng thử lại",
) => e?.response?.data?.message ?? fallback;
