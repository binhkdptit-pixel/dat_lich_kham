import { Schema, model } from "mongoose";

const scheduleSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: true });

scheduleSchema.index({ doctor: 1, date: 1 });
export default model("Schedule", scheduleSchema);
