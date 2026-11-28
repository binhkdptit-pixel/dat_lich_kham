import { Schema, model, Types } from "mongoose";

const doctorSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true }, // mỗi User chỉ có 1 hồ sơ bác sĩ
    specialty: { type: Types.ObjectId, ref: "Specialty", required: true, index: true },
    experience: { type: Number, min: 0, max: 60, default: 0 }, // số năm kinh nghiệm
    description: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true }
);

export default model("Doctor", doctorSchema);