import { Schema, model } from "mongoose";

// Luồng trạng thái (D kiểm tra khi đổi trạng thái):
// pending -> confirmed -> completed;  pending/confirmed -> cancelled
const appointmentSchema = new Schema(
  {
    // Người đặt (lấy từ token, KHÔNG nhận từ body)
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Bản chụp tên/SĐT lúc đặt: bác sĩ xem lịch không cần populate,
    // và đổi tên tài khoản sau này không làm sai hồ sơ cũ.
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    // Lưu như "nhãn ngày" ở 00:00 UTC (cùng quy ước với D: utils/time.ts -> parseDate)
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "HH:mm"
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    result: { type: String }, // kết quả khám, do bác sĩ ghi khi hoàn thành
  },
  { timestamps: true },
);

// Lớp bảo vệ cuối cùng chống đặt trùng: chỉ lịch CHƯA huỷ mới chiếm khung giờ.
// Huỷ lịch (status = cancelled) thì bản ghi không còn nằm trong index -> khung giờ được nhả.
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "completed"] },
    },
  },
);

// Tăng tốc "lịch của tôi"
appointmentSchema.index({ patient: 1, date: -1 });

export default model("Appointment", appointmentSchema);
