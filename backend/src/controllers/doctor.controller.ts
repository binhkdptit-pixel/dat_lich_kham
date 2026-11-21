import { Request, Response } from "express";
import Doctor from "../models/Doctor";
import { getAvailableSlots, requireDoctor } from "../services/slots";
import { objectId, optionalText, requiredText } from "../utils/validation";
import { parseDate } from "../utils/time";

export const getDoctors = async (_req: Request, res: Response) => {
  const doctors = await Doctor.find();
  res.json(doctors);
};

export const createDoctor = async (req: Request, res: Response) => {
  const doctor = await Doctor.create({
    name: requiredText(req.body.name, "Tên bác sĩ", 100),
    specialty: requiredText(req.body.specialty, "Chuyên khoa", 100),
    phone: optionalText(req.body.phone, "Số điện thoại", 20),
    description: optionalText(req.body.description, "Mô tả"),
  });
  res.status(201).json(doctor);
};

// API công khai chỉ trả khung giờ trống, không trả thông tin bệnh nhân.
export const getDoctorSlots = async (req: Request, res: Response) => {
  const doctor = objectId(req.params.id, "ID bác sĩ");
  const date = parseDate(req.query.date);
  await requireDoctor(doctor);
  res.json({ doctor, date: req.query.date, slotMinutes: 30, ...await getAvailableSlots(doctor, date) });
};
