import type { Role } from "../types";

// Trang chính của từng vai trò sau khi đăng nhập
export function homeByRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor";
    default:
      return "/patient";
  }
}


const ROLE_LABELS: Record<Role, string> = {
  patient: "Bệnh nhân",
  doctor: "Bác sĩ",
  admin: "Quản trị viên",
};

// Tên vai trò hiển thị cho người dùng
export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}