import { isAxiosError } from "axios";

// Lấy thông báo lỗi từ API. Lỗi kiểm tra dữ liệu (400) trả về danh sách errors, ghép lại để hiển thị
export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: { message: string }[] }
      | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(". ");
    if (data?.message) return data.message;
    if (!err.response) return "Không kết nối được máy chủ";
  }
  return "Có lỗi xảy ra, vui lòng thử lại";
}