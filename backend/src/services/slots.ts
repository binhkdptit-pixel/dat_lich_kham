import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import Schedule from "../models/Schedule";
import { HttpError } from "../utils/http";
import { appointmentTime, formatTime, minutes } from "../utils/time";

export async function requireDoctor(id: string): Promise<void> {
  if (!await Doctor.exists({ _id: id })) throw new HttpError(404, "Không tìm thấy bác sĩ");
}

export async function getWorkingSlots(doctor: string, date: Date) {
  const schedules = await Schedule.find({ doctor, date }).sort({ startTime: 1 });
  let periods = schedules.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
  // Có ca trong ngày thì chỉ dùng ca đã khai báo. Chưa có ca: mặc định thứ 2 đến thứ 7.
  if (periods.length === 0 && date.getUTCDay() !== 0) {
    periods = [{ startTime: "08:00", endTime: "11:30" }, { startTime: "13:30", endTime: "16:30" }];
  }
  const slots = new Set<string>();
  for (const period of periods) {
    // Một lượt khám dài 30 phút và phải kết thúc trước hoặc đúng giờ hết ca.
    for (let time = minutes(period.startTime); time + 30 <= minutes(period.endTime); time += 30) {
      slots.add(formatTime(time));
    }
  }
  return { slots: [...slots].sort(), source: schedules.length ? "schedule" : "default" };
}

export async function getAvailableSlots(doctor: string, date: Date) {
  const working = await getWorkingSlots(doctor, date);
  const booked = await Appointment.find({ doctor, date, status: { $ne: "cancelled" } }).select("timeSlot");
  const busy = new Set(booked.map(a => a.timeSlot));
  return {
    source: working.source,
    slots: working.slots.filter(time => !busy.has(time) && appointmentTime(date, time) > Date.now()),
  };
}
