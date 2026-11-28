import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import User from "../models/User";

//  trả về "hôm nay theo giờ Việt Nam" dưới dạng nhãn ngày 00:00 UTC
//  cộng 7 giờ (UTC+7) rồi lấy 10 ký tự đầu, ví dụ "2026-11-28"
const todayLabel = () => {
  const vn = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(`${vn}T00:00:00.000Z`);
};

// GET /api/stats  (chỉ admin)
export async function getStats(_req: Request, res: Response) {
  const [doctors, patients, byStatus, todayAppointments] = await Promise.all([
    Doctor.countDocuments(),
    User.countDocuments({ role: "patient" }),
    // đếm số lịch theo từng trạng thái bằng một truy vấn aggregate
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.find({ date: todayLabel() })
      .populate("doctor")
      .sort({ timeSlot: 1 }),
  ]);

  // trạng thái chưa có lịch nào vẫn phải trả về 0
  const appointments: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const row of byStatus) appointments[row._id] = row.count;

  res.json({
    doctors,
    patients,
    appointments,
    total: Object.values(appointments).reduce((a, b) => a + b, 0),
    today: todayAppointments,
  });
}
