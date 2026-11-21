import { NextFunction, Request, Response } from "express";
import Specialty from "../models/Specialty";

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