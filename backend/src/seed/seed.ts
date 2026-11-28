import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import Specialty from "../models/Specialty";
import Doctor from "../models/Doctor";
import Appointment from "../models/Appointment";

// giai đoạn 1: dùng model Doctor hiện có trên main { name, specialty (chuỗi), phone, description }.

const PASSWORD = "123456"; // mật khẩu chung cho mọi tài khoản mẫu, model User của bình tự băm trong pre("save")

// nhãn ngày 00:00 UTC của (hôm nay theo giờ VN + n ngày), cùng quy ước với trường date của Appointment
// ví dụ : n = 0 là hôm nay, 1 là ngày mai, -3 là 3 ngày trước
const dayLabel = (n: number) => {
  const vn = new Date(Date.now() + 7 * 3600 * 1000);
  vn.setUTCDate(vn.getUTCDate() + n);
  return new Date(`${vn.toISOString().slice(0, 10)}T00:00:00.000Z`);
};
// main() -->   hàm chính: kết nối DB, xoá dữ liệu cũ, tạo dữ liệu mới, ngắt kết nối
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Thiếu MONGO_URI trong .env");
  // Atlas có thể là database dùng chung: bắt buộc xác nhận bằng biến môi trường SEED_FORCE=1
  if (uri.startsWith("mongodb+srv") && process.env.SEED_FORCE !== "1") {
    throw new Error(
      "MONGO_URI là Atlas. Nếu đây là database dev của riêng bạn, đặt SEED_FORCE=1 rồi chạy lại.",
    );
  }
  await mongoose.connect(uri);
  await Promise.all(
    [User, Specialty, Doctor, Appointment].map((m: any) => m.deleteMany({})),
  );

  // phải dùng create() từng người (chạy pre-save băm mật khẩu). KHÔNG dùng insertMany() cho User.
  const admin = await User.create({
    name: "Quản trị viên",
    email: "admin@test.com",
    password: PASSWORD,
    phone: "0900000001",
    role: "admin",
  });
  const patients: any[] = [];
  for (const [i, name] of [
    "Nguyễn Văn An",
    "Trần Thị Bình",
    "Lê Minh Châu",
  ].entries()) {
    patients.push(
      await User.create({
        name,
        email: `benhnhan${i + 1}@test.com`,
        password: PASSWORD,
        phone: `09000000${i + 2}0`,
        role: "patient",
      }),
    );
  }

  // khớp model Specialty của B: { name, description }
  const specialties = await Specialty.create([
    { name: "Nội tổng quát", description: "Khám và điều trị bệnh nội khoa" },
    { name: "Nhi khoa", description: "Chăm sóc sức khoẻ trẻ em" },
    { name: "Da liễu", description: "Các bệnh về da, tóc, móng" },
  ]);

  // ĐỔI THEO B: hiện Doctor là { name, specialty (chuỗi tên chuyên khoa), phone, description }
  const doctors = await Doctor.create(
    ["BS. Phạm Quốc Dũng", "BS. Hoàng Thu Hà", "BS. Đỗ Gia Huy"].map(
      (name, i) => ({
        name,
        specialty: specialties[i].name,
        phone: `09100000${i + 1}0`,
        description: `Bác sĩ ${specialties[i].name}`,
      }),
    ),
  );

  // lịch hẹn mẫu ở đủ 4 trạng thái. Mỗi (bác sĩ, ngày, giờ) là duy nhất để không vướng index chống trùng.
  const mk = (
    p: number,
    d: number,
    dayOffset: number,
    timeSlot: string,
    status: string,
    extra: object = {},
  ) => ({
    patient: patients[p]._id,
    patientName: patients[p].name,
    phone: patients[p].phone,
    doctor: doctors[d]._id,
    date: dayLabel(dayOffset),
    timeSlot,
    reason: "Khám định kỳ",
    status,
    ...extra,
  });
  await Appointment.create([
    mk(0, 0, 0, "08:00", "pending"), // 3 lịch hôm nay: hiện ở trang Tổng quan
    mk(1, 1, 0, "09:30", "confirmed"),
    mk(2, 2, 0, "16:00", "confirmed"),
    mk(0, 0, 1, "08:30", "pending"),
    mk(1, 2, 3, "14:00", "cancelled"),
    mk(2, 0, -3, "10:00", "completed", {
      result: "Sức khoẻ ổn định, tái khám sau 3 tháng.",
    }),
  ]);

  console.log("Seed xong. Mật khẩu chung: " + PASSWORD);
  console.log(
    `  admin: ${admin.email} | bệnh nhân: benhnhan1@test.com, benhnhan2@test.com, benhnhan3@test.com`,
  );
  await mongoose.disconnect();
}

// có lỗi thì in ra và thoát với mã 1
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
