import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/http";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, details: err.details });
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) return res.status(400).json({ message: "Dữ liệu không hợp lệ", details: err.message });
  if ((err as Error & { code?: number }).code === 11000) return res.status(409).json({ message: "Khung giờ này đã có người đặt" });
  if ((err as Error & { type?: string }).type === "entity.parse.failed") return res.status(400).json({ message: "Nội dung JSON không hợp lệ" });
  console.error(err);
  return res.status(500).json({ message: "Lỗi server" });
};
