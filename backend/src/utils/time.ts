import { HttpError } from "./http";

// Ngày khám được hiểu theo giờ Việt Nam, không phụ thuộc múi giờ máy chạy server.
export function parseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "Ngày phải có dạng YYYY-MM-DD");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, "Ngày không hợp lệ");
  }
  // Lưu ngày ở UTC 00:00 như một nhãn ngày; giờ hẹn thực tế được tính bên dưới.
  return date;
}

export function minutes(value: unknown): number {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new HttpError(400, "Giờ phải có dạng HH:mm, từ 00:00 đến 23:59");
  }
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function formatTime(value: number): string {
  return `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}

export function appointmentTime(date: Date, time: string): number {
  return new Date(`${date.toISOString().slice(0, 10)}T${time}:00+07:00`).getTime();
}

export function today(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
