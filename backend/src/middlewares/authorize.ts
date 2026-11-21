import { Request, Response, NextFunction } from "express";
import { Role } from "../models/User";

// Cách dùng: authorize("admin") hoặc authorize("doctor", "admin")
export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }
    next();
  };