import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Thiếu MONGO_URI trong file .env");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};
