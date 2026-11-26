import { NextFunction, Request, Response } from "express";
import Specialty from "../models/Specialty";
import Doctor from "../models/Doctor";

const DUPLICATE_KEY = 11000;
const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === DUPLICATE_KEY;

// GET /api/specialties (công khai)
export const getSpecialties = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await Specialty.find()
      .select("name description")
      .collation({ locale: "vi" }) // sắp xếp đúng thứ tự chữ tiếng Việt
      .sort({ name: 1 })
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// POST /api/specialties (admin)
export const createSpecialty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body; // chỉ lấy đúng 2 trường, tránh gán dữ liệu thừa
    const specialty = await Specialty.create({ name, description });
    res.status(201).json(specialty);
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ message: "Tên chuyên khoa đã tồn tại" });
      return;
    }
    next(err);
  }
};

// PUT /api/specialties/:id (admin)
export const updateSpecialty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const specialty = await Specialty.findByIdAndUpdate(
      req.params.id,
      { name, description }, // trường undefined bị bỏ qua, không ghi đè dữ liệu cũ
      { new: true, runValidators: true }
    ).lean();

    if (!specialty) {
      res.status(404).json({ message: "Không tìm thấy chuyên khoa" });
      return;
    }
    res.json(specialty);
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ message: "Tên chuyên khoa đã tồn tại" });
      return;
    }
    next(err);
  }
};

// DELETE /api/specialties/:id (admin): chặn nếu còn bác sĩ
export const deleteSpecialty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inUse = await Doctor.exists({ specialty: req.params.id });
    if (inUse) {
      res.status(409).json({ message: "Không thể xoá: chuyên khoa đang có bác sĩ" });
      return;
    }

    const deleted = await Specialty.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ message: "Không tìm thấy chuyên khoa" });
      return;
    }
    res.json({ message: "Đã xoá chuyên khoa" });
  } catch (err) {
    next(err);
  }
};