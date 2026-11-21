import { Schema, model, Types } from "mongoose";

const appointmentSchema = new Schema(
  {
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    doctor: { type: Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // vd: "08:00"
    reason: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    result: String, // Kết quả khám do bác sĩ ghi khi hoàn thành lịch hẹn.
  },
  { timestamps: true }
);

// Chỉ lịch chưa hủy mới chiếm chỗ. Index còn bảo vệ khi có request đồng thời.
appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, {
  unique: true,
  partialFilterExpression: { status: { $in: ["pending", "confirmed", "completed"] } },
});
export default model("Appointment", appointmentSchema);
