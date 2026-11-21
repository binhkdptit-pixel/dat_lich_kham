import { Request, Response } from "express";
import Appointment from "../models/Appointment";

export const getAppointments = async (_req: Request, res: Response) => {
  const list = await Appointment.find().populate("doctor").sort({ date: 1 });
  res.json(list);
};

export const createAppointment = async (req: Request, res: Response) => {
  const { doctor, date, timeSlot } = req.body;

  // Chặn trùng lịch: cùng bác sĩ, cùng ngày, cùng khung giờ
  const existed = await Appointment.findOne({
    doctor,
    date,
    timeSlot,
    status: { $ne: "cancelled" },
  });
  if (existed) {
    return res.status(409).json({ message: "Khung giờ này đã có người đặt" });
  }

  const appointment = await Appointment.create(req.body);
  res.status(201).json(appointment);
};

export const updateStatus = async (req: Request, res: Response) => {
  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
  res.json(updated);
};
