import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import { checkOwner } from "../middlewares/auth";
import { HttpError } from "../utils/http";
import { objectId, optionalText, requiredText } from "../utils/validation";
import { appointmentTime, minutes, parseDate } from "../utils/time";
import { getAvailableSlots, requireDoctor } from "../services/slots";
import { withDoctorLock } from "../services/doctorLock";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

function listFilter(req: Request): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (req.query.date !== undefined) filter.date = parseDate(req.query.date);
  if (req.query.status !== undefined) {
    if (typeof req.query.status !== "string" || !statuses.includes(req.query.status)) throw new HttpError(400, "Trạng thái không hợp lệ");
    filter.status = req.query.status;
  }
  return filter;
}

export async function getDoctorAppointments(req: Request, res: Response) {
  const filter = listFilter(req);
  filter.doctor = req.user!.doctorId;
  res.json(await Appointment.find(filter).sort({ date: 1, timeSlot: 1 }));
}

export async function getAppointments(req: Request, res: Response) {
  const filter = listFilter(req);
  if (req.query.doctor !== undefined) filter.doctor = objectId(req.query.doctor, "ID bác sĩ");
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, "page từ 1 đến 100000, limit từ 1 đến 100 và phải là số nguyên");
  }
  const [data, total] = await Promise.all([
    Appointment.find(filter).populate("doctor", "name specialty").sort({ date: 1, timeSlot: 1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    Appointment.countDocuments(filter),
  ]);
  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

// Giữ API đặt hẹn cũ, bổ sung kiểm tra ca và chỉ nhận các trường bệnh nhân được phép nhập.
export async function createAppointment(req: Request, res: Response) {
  const doctor = objectId(req.body.doctor, "ID bác sĩ");
  const date = parseDate(req.body.date);
  minutes(req.body.timeSlot);
  const timeSlot = req.body.timeSlot as string;
  const patientName = requiredText(req.body.patientName, "Tên bệnh nhân", 100);
  const phone = requiredText(req.body.phone, "Số điện thoại", 20);
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw new HttpError(400, "Số điện thoại cần có từ 9 đến 15 chữ số");
  const reason = optionalText(req.body.reason, "Lý do khám");
  await requireDoctor(doctor);
  const appointment = await withDoctorLock(doctor, async () => {
    const available = await getAvailableSlots(doctor, date);
    if (!available.slots.includes(timeSlot)) throw new HttpError(409, "Khung giờ đã có người đặt, đã qua hoặc ngoài ca làm việc");
    return Appointment.create({ doctor, date, timeSlot, patientName, phone, reason, status: "pending" });
  });
  res.status(201).json(appointment);
}

export async function updateStatus(req: Request, res: Response) {
  const id = objectId(req.params.id);
  const original = await Appointment.findById(id);
  if (!original) throw new HttpError(404, "Không tìm thấy lịch hẹn");
  checkOwner(req.user!, original.doctor);
  const status = req.body.status;
  if (typeof status !== "string" || !statuses.includes(status)) throw new HttpError(400, "Trạng thái không hợp lệ");
  const updated = await withDoctorLock(String(original.doctor), async () => {
    const appointment = await Appointment.findById(id);
    if (!appointment) throw new HttpError(404, "Không tìm thấy lịch hẹn");
    const transitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"], completed: [], cancelled: [],
    };
    // Không cho nhảy thẳng từ chờ duyệt sang hoàn thành, hay mở lại lịch đã hủy.
    if (!transitions[appointment.status]?.includes(status)) throw new HttpError(409, `Không thể chuyển từ ${appointment.status} sang ${status}`);
    if (status === "completed") {
      if (appointmentTime(appointment.date, appointment.timeSlot) > Date.now()) throw new HttpError(409, "Chưa đến giờ khám, không thể hoàn thành lịch hẹn");
      appointment.result = requiredText(req.body.result, "Kết quả khám", 5000);
    } else if (req.body.result !== undefined) throw new HttpError(400, "Chỉ ghi kết quả khám khi hoàn thành lịch hẹn");
    appointment.status = status as typeof appointment.status;
    return appointment.save();
  });
  res.json(updated);
}
