import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import User from "../models/User";
import Doctor from "../models/Doctor";
import Specialty from "../models/Specialty";
import Appointment from "../models/Appointment";

const DUPLICATE_KEY = 11000;
const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === DUPLICATE_KEY;

// API công khai chỉ trả tên, không trả email, số điện thoại hay mật khẩu
const publicPopulate = [
  { path: "user", select: "name" },
  { path: "specialty", select: "name" },
];

// GET /api/doctors?specialty= (công khai)
export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Chỉ nhận chuỗi, chặn trường hợp ?specialty[$ne]=... (NoSQL injection)
    const specialty = typeof req.query.specialty === "string" ? req.query.specialty : undefined;
    const doctors = await Doctor.find(specialty ? { specialty } : {})
      .populate(publicPopulate)
      .sort({ createdAt: -1 })
      .lean();
    res.json(doctors);
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/:id (công khai)
export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(publicPopulate).lean();
    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

// POST /api/doctors (admin): tạo tài khoản User (role doctor) rồi tạo hồ sơ Doctor
export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, phone, specialty, experience, description } = req.body;
  let createdUserId: Types.ObjectId | undefined;

  try {
    const [specialtyExists, emailTaken] = await Promise.all([
      Specialty.exists({ _id: specialty }),
      User.exists({ email }),
    ]);
    if (!specialtyExists) {
      res.status(400).json({ message: "Chuyên khoa không tồn tại" });
      return;
    }
    if (emailTaken) {
      res.status(409).json({ message: "Email đã được sử dụng" });
      return;
    }

    // User.create chạy hook băm mật khẩu của A
    const user = await User.create({ name, email, password, phone, role: "doctor" });
    createdUserId = user._id;

    const doctor = await Doctor.create({ user: user._id, specialty, experience, description });
    const populated = await doctor.populate(publicPopulate);
    res.status(201).json(populated);
  } catch (err) {
    // Không dùng transaction để chạy được cả MongoDB local (standalone).
    // Nếu tạo Doctor lỗi sau khi đã tạo User thì xoá User vừa tạo để không để lại tài khoản "mồ côi".
    if (createdUserId) {
      await User.deleteOne({ _id: createdUserId }).catch((e) =>
        console.error("Rollback User thất bại:", e)
      );
    }
    if (isDuplicateKey(err)) {
      res.status(409).json({ message: "Email đã được sử dụng" });
      return;
    }
    next(err);
  }
};

// PUT /api/doctors/:id (admin): name và phone nằm ở User, còn lại nằm ở Doctor
export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, specialty, experience, description } = req.body;

    const current = await Doctor.findById(req.params.id).select("user").lean();
    if (!current) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }

    if (specialty && !(await Specialty.exists({ _id: specialty }))) {
      res.status(400).json({ message: "Chuyên khoa không tồn tại" });
      return;
    }

    if (name !== undefined || phone !== undefined) {
      await User.updateOne({ _id: current.user }, { name, phone }, { runValidators: true });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { specialty, experience, description },
      { new: true, runValidators: true }
    )
      .populate(publicPopulate)
      .lean();

    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/doctors/:id (admin): chặn nếu còn lịch hẹn
export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("user").lean();
    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }

    const hasAppointments = await Appointment.exists({ doctor: doctor._id });
    if (hasAppointments) {
      res.status(409).json({ message: "Không thể xoá: bác sĩ đang có lịch hẹn" });
      return;
    }

    // Xoá Doctor trước, User sau. Khi D có model Schedule thì thống nhất xoá kèm ca làm việc.
    await Doctor.deleteOne({ _id: doctor._id });
    await User.deleteOne({ _id: doctor.user });
    res.json({ message: "Đã xoá bác sĩ" });
  } catch (err) {
    next(err);
  }
};