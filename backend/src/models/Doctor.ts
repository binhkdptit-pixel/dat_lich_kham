import { Schema, model } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true }, // chuyên khoa
    phone: String,
    description: String,
  },
  { timestamps: true }
);

export default model("Doctor", doctorSchema);
