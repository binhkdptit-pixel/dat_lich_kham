import { Schema, model } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true }, // chuyên khoa
    phone: String,
    description: String,
    // Trường nội bộ để tuần tự hóa thao tác lịch; không trả về trong danh sách bác sĩ.
    scheduleLock: { type: String, select: false },
  },
  { timestamps: true }
);

export default model("Doctor", doctorSchema);
