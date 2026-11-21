import Doctor from "../models/Doctor";
import { HttpError } from "../utils/http";
import { Types } from "mongoose";

// Khóa ngắn trong MongoDB giúp hai request không cùng kiểm tra rồi ghi đè lịch bác sĩ.
// Dùng chung khóa cho thêm/sửa/xóa ca, đặt hẹn và đổi trạng thái.
export async function withDoctorLock<T>(doctor: string, action: () => Promise<T>): Promise<T> {
  const owner = new Types.ObjectId().toString();
  const locked = await Doctor.findOneAndUpdate(
    { _id: doctor, $or: [{ scheduleLock: null }, { scheduleLock: { $exists: false } }] },
    { $set: { scheduleLock: owner } }, { new: true }
  );
  if (!locked) throw new HttpError(409, "Bác sĩ không tồn tại hoặc đang có thao tác khác, vui lòng thử lại");
  try { return await action(); }
  finally { await Doctor.updateOne({ _id: doctor, scheduleLock: owner }, { $unset: { scheduleLock: 1 } }); }
}
