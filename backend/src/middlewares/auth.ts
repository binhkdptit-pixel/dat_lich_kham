import { createHmac, timingSafeEqual } from "crypto";
import { RequestHandler } from "express";
import { isObjectIdOrHexString } from "mongoose";
import { HttpError } from "../utils/http";

export interface AuthUser {
  role: "doctor" | "admin";
  doctorId?: string;
  exp: number;
}

declare global {
  namespace Express { interface Request { user?: AuthUser; } }
}

// Token nội bộ gồm payload và chữ ký HMAC. Không tin role/doctorId do client gửi trong body.
// Khi nhóm có đăng nhập, server đăng nhập sẽ tạo token này sau khi kiểm tra mật khẩu.
export const authenticate: RequestHandler = (req, _res, next) => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return next(new HttpError(503, "Cần cấu hình AUTH_SECRET ít nhất 32 ký tự"));
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Bạn chưa đăng nhập"));
  try {
    const parts = header.slice(7).split(".");
    if (parts.length !== 2) throw new Error();
    const [payload, signature] = parts;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
    const user = JSON.parse(Buffer.from(payload, "base64url").toString()) as AuthUser;
    if (!["admin", "doctor"].includes(user.role) || !Number.isFinite(user.exp) || user.exp <= Date.now() / 1000) throw new Error();
    if (user.role === "doctor" && !isObjectIdOrHexString(user.doctorId)) throw new Error();
    req.user = user;
    next();
  } catch {
    next(new HttpError(401, "Token không hợp lệ hoặc đã hết hạn"));
  }
};

export const adminOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "admin") return next(new HttpError(403, "Chỉ admin được sử dụng chức năng này"));
  next();
};

export const doctorOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "doctor") return next(new HttpError(403, "Chỉ bác sĩ được sử dụng chức năng này"));
  next();
};

export function checkOwner(user: AuthUser, doctorId: unknown): void {
  if (user.role === "doctor" && user.doctorId !== String(doctorId)) {
    throw new HttpError(403, "Bác sĩ chỉ được thao tác dữ liệu của mình");
  }
}
