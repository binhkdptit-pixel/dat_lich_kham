import mongoose from "mongoose";
import Appointment from "../models/Appointment";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Thiếu MONGO_URI trong file .env");
  await mongoose.connect(uri);
  // Tạo index chống đặt trùng trước khi server bắt đầu nhận request.
  await Appointment.init();
  console.log("MongoDB connected");
};
