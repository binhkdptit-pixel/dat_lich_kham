import { Request, Response } from "express";
import Schedule from "../models/Schedule";
import Appointment from "../models/Appointment";
import { checkOwner } from "../middlewares/auth";
import { HttpError } from "../utils/http";
import { objectId } from "../utils/validation";
import { appointmentTime, formatTime, minutes, parseDate, today } from "../utils/time";
import { requireDoctor } from "../services/slots";
import { withDoctorLock } from "../services/doctorLock";

export async function getSchedules(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.doctor !== undefined) {
    filter.doctor = objectId(req.query.doctor, "ID bác sĩ");
    checkOwner(req.user!, filter.doctor);
  }
  // Bác sĩ luôn bị giới hạn theo ID trong token, không lấy ID tùy ý từ query.
  if (req.user!.role === "doctor") filter.doctor = req.user!.doctorId;
  if (req.query.date !== undefined) filter.date = parseDate(req.query.date);
  res.json(await Schedule.find(filter).populate("doctor", "name specialty").sort({ date: 1, startTime: 1 }));
}

function validatePeriod(date: Date, startTime: unknown, endTime: unknown) {
  const start = minutes(startTime);
  const end = minutes(endTime);
  if (start >= end || (end - start) % 30 !== 0) {
    throw new HttpError(400, "Giờ kết thúc phải sau giờ bắt đầu; độ dài ca phải chia hết cho 30 phút");
  }
  if (date.toISOString().slice(0, 10) < today() || appointmentTime(date, startTime as string) <= Date.now()) {
    throw new HttpError(400, "Không được tạo hoặc chuyển ca vào thời gian đã qua");
  }
}

async function checkOverlap(doctor: string, date: Date, startTime: string, endTime: string, except?: string) {
  // Hai ca trùng nhau khi ca cũ bắt đầu trước lúc ca mới kết thúc và ngược lại.
  const filter: Record<string, unknown> = { doctor, date, startTime: { $lt: endTime }, endTime: { $gt: startTime } };
  if (except) filter._id = { $ne: except };
  if (await Schedule.exists(filter)) throw new HttpError(409, "Ca làm việc bị trùng giờ với ca đã có");
}

async function protectAppointments(doctor: string, date: Date, except?: string, added?: { startTime: string; endTime: string }) {
  const filter: Record<string, unknown> = { doctor, date };
  if (except) filter._id = { $ne: except };
  let periods = (await Schedule.find(filter)).map(s => ({ startTime: s.startTime, endTime: s.endTime }));
  if (added) periods.push(added);
  if (periods.length === 0 && date.getUTCDay() !== 0) {
    periods = [{ startTime: "08:00", endTime: "11:30" }, { startTime: "13:30", endTime: "16:30" }];
  }
  const valid = new Set<string>();
  for (const period of periods) {
    for (let t = minutes(period.startTime); t + 30 <= minutes(period.endTime); t += 30) valid.add(formatTime(t));
  }
  const appointments = await Appointment.find({ doctor, date, status: { $in: ["pending", "confirmed"] } });
  // Thêm ca đầu tiên cũng có thể làm mất khung mặc định mà bệnh nhân đã đặt trước đó.
  const invalid = appointments.filter(a => appointmentTime(a.date, a.timeSlot) > Date.now() && !valid.has(a.timeSlot));
  if (invalid.length) throw new HttpError(409, "Thay đổi ca sẽ làm mất khung giờ của lịch hẹn sắp tới", { appointmentIds: invalid.map(a => a.id) });
}

export async function createSchedule(req: Request, res: Response) {
  const doctor = req.user!.role === "doctor" ? req.user!.doctorId! : objectId(req.body.doctor, "ID bác sĩ");
  if (req.body.doctor !== undefined) checkOwner(req.user!, objectId(req.body.doctor, "ID bác sĩ"));
  const date = parseDate(req.body.date);
  const { startTime, endTime } = req.body;
  validatePeriod(date, startTime, endTime);
  await requireDoctor(doctor);
  const schedule = await withDoctorLock(doctor, async () => {
    await checkOverlap(doctor, date, startTime, endTime);
    await protectAppointments(doctor, date, undefined, { startTime, endTime });
    return Schedule.create({ doctor, date, startTime, endTime });
  });
  res.status(201).json(schedule);
}

export async function updateSchedule(req: Request, res: Response) {
  const id = objectId(req.params.id);
  const original = await Schedule.findById(id);
  if (!original) throw new HttpError(404, "Không tìm thấy ca làm việc");
  checkOwner(req.user!, original.doctor);
  if (req.body.doctor !== undefined && objectId(req.body.doctor) !== String(original.doctor)) {
    throw new HttpError(400, "Không được đổi bác sĩ của ca; hãy tạo ca mới");
  }
  const updated = await withDoctorLock(String(original.doctor), async () => {
    // Đọc lại sau khi giữ khóa để tránh dùng dữ liệu cũ của request khác.
    const schedule = await Schedule.findById(id);
    if (!schedule) throw new HttpError(404, "Không tìm thấy ca làm việc");
    const date = req.body.date === undefined ? schedule.date : parseDate(req.body.date);
    const startTime = req.body.startTime ?? schedule.startTime;
    const endTime = req.body.endTime ?? schedule.endTime;
    validatePeriod(date, startTime, endTime);
    await checkOverlap(String(schedule.doctor), date, startTime, endTime, id);
    if (date.getTime() !== schedule.date.getTime()) await protectAppointments(String(schedule.doctor), schedule.date, id);
    await protectAppointments(String(schedule.doctor), date, id, { startTime, endTime });
    schedule.set({ date, startTime, endTime });
    return schedule.save();
  });
  res.json(updated);
}

export async function deleteSchedule(req: Request, res: Response) {
  const id = objectId(req.params.id);
  const original = await Schedule.findById(id);
  if (!original) throw new HttpError(404, "Không tìm thấy ca làm việc");
  checkOwner(req.user!, original.doctor);
  await withDoctorLock(String(original.doctor), async () => {
    const schedule = await Schedule.findById(id);
    if (!schedule) throw new HttpError(404, "Không tìm thấy ca làm việc");
    const appointments = await Appointment.find({ doctor: schedule.doctor, date: schedule.date, status: { $in: ["pending", "confirmed"] } });
    const upcoming = appointments.filter(a => appointmentTime(a.date, a.timeSlot) > Date.now() && a.timeSlot >= schedule.startTime && a.timeSlot < schedule.endTime);
    // Chọn cách cảnh báo và chặn xóa, để bác sĩ xử lý lịch hẹn trước rồi mới xóa ca.
    if (upcoming.length) throw new HttpError(409, "Ca còn lịch hẹn sắp tới, cần hủy hoặc xử lý lịch hẹn trước khi xóa", { appointmentIds: upcoming.map(a => a.id), count: upcoming.length });
    await protectAppointments(String(schedule.doctor), schedule.date, id);
    await schedule.deleteOne();
  });
  res.json({ message: "Đã xóa ca làm việc" });
}
