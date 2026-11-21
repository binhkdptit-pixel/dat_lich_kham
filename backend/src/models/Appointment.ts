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
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default model("Appointment", appointmentSchema);
