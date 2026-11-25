import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Trùng giá trị duy nhất (ví dụ email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "Dữ liệu";
    return res.status(409).json({ message: `${field} đã tồn tại` });
  }
  // Lỗi kiểm tra dữ liệu của Mongoose
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  // Mã (id) sai định dạng
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Mã (id) không hợp lệ" });
  }

  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || "Lỗi server" });
};