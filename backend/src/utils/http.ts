import { RequestHandler } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

// Express 4 không tự chuyển lỗi của hàm async sang middleware xử lý lỗi.
export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
