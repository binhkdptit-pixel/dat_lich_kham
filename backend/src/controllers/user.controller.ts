import { Request, Response } from "express";
import User, { Role } from "../models/User";
import Doctor from "../models/Doctor";
import Appointment from "../models/Appointment";

// GET /api/users?role=&page=&limit=  (admin): danh sách có lọc và phân trang
export const getUsers = async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = String(req.query.role);

  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
};

// POST /api/users (admin): tạo người dùng với vai trò bất kỳ trừ bác sĩ
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  const role: Role = req.body.role || "patient";

  // Bác sĩ phải có hồ sơ bác sĩ đi kèm, nên tạo ở mục Quản lý bác sĩ
  if (role === "doctor") {
    return res
      .status(400)
      .json({ message: "Tạo bác sĩ ở mục Quản lý bác sĩ để có đủ hồ sơ bác sĩ" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: "Email đã được sử dụng" });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    phone,
    role,
  });
  res.status(201).json({ user });
};

// PUT /api/users/:id (admin): sửa thông tin, đổi vai trò, khoá hoặc mở khoá
export const updateUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select("+password");
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const isSelf = String(user._id) === String(req.user!._id);
  const { name, email, phone, role, isActive } = req.body;

  if (role !== undefined && role !== user.role) {
    // Bác sĩ được quản lý ở mục Quản lý bác sĩ, không đổi vai trò tại đây
    if (role === "doctor" || user.role === "doctor") {
      return res.status(400).json({
        message: "Không đổi vai trò từ hoặc sang bác sĩ tại đây. Dùng mục Quản lý bác sĩ",
      });
    }
    if (isSelf) {
      return res.status(400).json({ message: "Không thể tự đổi vai trò của chính mình" });
    }
    user.role = role;
  }

  if (isActive !== undefined) {
    const active = isActive === true || isActive === "true";
    if (isSelf && !active) {
      return res.status(400).json({ message: "Không thể tự khoá chính mình" });
    }
    user.isActive = active;
  }

  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = phone;

  if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();
    if (newEmail !== user.email && (await User.exists({ email: newEmail }))) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }
    user.email = newEmail;
  }

  await user.save();
  res.json({ user });
};

// DELETE /api/users/:id (admin): xoá người dùng, chặn khi còn dữ liệu liên quan
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (String(req.user!._id) === id) {
    return res.status(400).json({ message: "Không thể xoá chính mình" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  // Còn lịch hẹn của người này với vai trò bệnh nhân
  if (await Appointment.exists({ patient: user._id })) {
    return res.status(409).json({ message: "Người dùng còn lịch hẹn, không thể xoá" });
  }
  // Còn hồ sơ bác sĩ gắn với tài khoản này
  if (await Doctor.exists({ user: user._id })) {
    return res.status(409).json({
      message: "Người dùng đang có hồ sơ bác sĩ, xoá hồ sơ bác sĩ trước",
    });
  }

  await User.deleteOne({ _id: user._id });
  res.json({ message: "Đã xoá người dùng" });
};