import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/User";

// Tạo token JWT, thời hạn lấy từ JWT_EXPIRES_IN
const signToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Thiếu JWT_SECRET trong file .env");

  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  });
};

// POST /api/auth/register: đăng ký bệnh nhân
export const register = async (req: Request, res: Response) => {
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim().toLowerCase();
  const { password, phone } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email đã được sử dụng" });
  }

  // Luôn gán role = patient, không nhận role từ client
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "patient",
  });

  const token = signToken(String(user._id), user.role);
  res.status(201).json({ token, user });
};

// POST /api/auth/login: đăng nhập
export const login = async (req: Request, res: Response) => {
  const email = String(req.body.email).trim().toLowerCase();
  const { password } = req.body;

  // password bị ẩn mặc định, phải chọn thêm mới so sánh được
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: "Tài khoản đã bị khoá" });
  }

  const token = signToken(String(user._id), user.role);
  res.json({ token, user });
};

// GET /api/auth/me: xem hồ sơ của mình
export const getMe = (req: Request, res: Response) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me: sửa hồ sơ của mình
export const updateMe = async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select("+password");
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const { name, phone, email, password, currentPassword } = req.body;

  // Đổi mật khẩu phải nhập đúng mật khẩu hiện tại
  if (password) {
    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    user.password = password; // được băm tự động khi save
  }

  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = phone;

  if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();
    const taken = await User.findOne({
      email: newEmail,
      _id: { $ne: user._id },
    });
    if (taken) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }
    user.email = newEmail;
  }

  // role và isActive không được sửa ở đây, chỉ bỏ qua nếu client gửi lên
  await user.save();
  res.json({ user });
};