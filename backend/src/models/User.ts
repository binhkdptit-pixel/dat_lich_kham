import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type Role = "patient" | "doctor" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false -> mặc định không trả mật khẩu khi truy vấn
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Tự động băm mật khẩu trước khi lưu
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// So sánh mật khẩu người dùng nhập với mật khẩu đã băm
userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Không bao giờ trả password ra ngoài khi chuyển sang JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj: any = ret;
    delete obj.password;
    delete obj.__v;
    return obj;
  },
});

export default model<IUser>("User", userSchema);