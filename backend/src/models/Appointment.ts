import { Schema, model } from "mongoose";

const appointmentSchema = new Schema(
  {
    //patient ->>	Tham chiếu tới User đặt lịch.
    // Lấy từ token đăng nhập, không nhận từ body request (tránh giả mạo người đặt).
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    //patientName, phone ->>	Bản chụp (snapshot) tên và SĐT tại thời điểm đặt.
    // Bác sĩ xem lịch không cần populate, và nếu bệnh nhân đổi tên tài khoản sau này thì hồ sơ cũ vẫn đúng.
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    //doctor -->	Tham chiếu tới Doctor được đặt.
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    // date --> Ngày khám, lưu dạng "nhãn ngày" lúc 00:00 UTC (thống nhất cách xử lý múi giờ với hàm parseDate).
    date: { type: Date, required: true },
    //timeSlot -->	Khung giờ dạng chuỗi "HH:mm", ví dụ "09:36".
    timeSlot: { type: String, required: true },
    //reason -->	Lý do khám (có trim để cắt khoảng trắng thừa).
    reason: { type: String, required: true, trim: true },
    //status -->	Trạng thái lịch, mặc định pending.
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    //result -->	Kết quả khám, bác sĩ ghi khi hoàn thành.
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
