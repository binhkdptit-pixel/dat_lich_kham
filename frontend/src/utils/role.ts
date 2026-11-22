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