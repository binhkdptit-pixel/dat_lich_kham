const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../dist/app").default;
const Doctor = require("../dist/models/Doctor").default;
const Appointment = require("../dist/models/Appointment").default;
const Schedule = require("../dist/models/Schedule").default;
const secret = "test-secret-only-012345678901234567890";
let mongo, server, base, doctor, other, doctorToken, adminToken;

function token(role, doctorId, exp = Date.now() / 1000 + 3600) {
  const payload = Buffer.from(JSON.stringify({ role, doctorId, exp })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
async function api(method, path, body, auth) {
  const response = await fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
// Chọn ngày thứ 2 trong tương lai để test không bị phụ thuộc ngày chạy.
const nextMonday = new Date(Date.now() + 14 * 86400000);
while (nextMonday.getUTCDay() !== 1) nextMonday.setUTCDate(nextMonday.getUTCDate() + 1);
const day = nextMonday.toISOString().slice(0, 10);
const sunday = new Date(nextMonday.getTime() + 6 * 86400000).toISOString().slice(0, 10);

before(async () => {
  process.env.AUTH_SECRET = secret;
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([Doctor.init(), Appointment.init(), Schedule.init()]);
  doctor = await Doctor.create({ name: "Bác sĩ A", specialty: "Nội" });
  other = await Doctor.create({ name: "Bác sĩ B", specialty: "Ngoại" });
  doctorToken = token("doctor", doctor.id);
  adminToken = token("admin");
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("8 API: phân quyền, ca làm việc, slot, lịch hẹn và trạng thái", async t => {
  let scheduleId, appointmentId;
  const scheduleBody = { doctor: doctor.id, date: day, startTime: "08:00", endTime: "11:30" };
  const bookingBody = { doctor: doctor.id, date: day, timeSlot: "08:00", patientName: "Nguyễn An", phone: "0901234567" };

  await t.test("Bảo vệ API: thiếu token, sai chữ ký, hết hạn, sai quyền", async () => {
    assert.equal((await api("GET", "/schedules")).status, 401);
    assert.equal((await api("GET", "/schedules", undefined, doctorToken + "x")).status, 401);
    assert.equal((await api("GET", "/schedules", undefined, token("doctor", doctor.id, 1))).status, 401);
    assert.equal((await api("GET", "/appointments", undefined, doctorToken)).status, 403);
    assert.equal((await api("GET", "/appointments/doctor", undefined, adminToken)).status, 403);
  });
  await t.test("Slot mặc định: 13 khung thứ 2, không có chủ nhật; kiểm tra ngày/ID", async () => {
    const r = await api("GET", `/doctors/${doctor.id}/slots?date=${day}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.slots.length, 13);
    assert.equal(r.body.source, "default");
    assert.ok(r.body.slots.includes("11:00"));
    assert.ok(!r.body.slots.includes("11:30"));
    assert.equal((await api("GET", `/doctors/${doctor.id}/slots?date=${sunday}`)).body.slots.length, 0);
    assert.equal((await api("GET", `/doctors/${doctor.id}/slots?date=2027-02-30`)).status, 400);
    assert.equal((await api("GET", "/doctors/sai-id/slots?date=" + day)).status, 400);
    assert.equal((await api("GET", `/doctors/${new mongoose.Types.ObjectId()}/slots?date=${day}`)).status, 404);
  });
  await t.test("Thêm ca, chặn ca trùng, cho hai ca liền nhau, chặn thao tác bác sĩ khác", async () => {
    const r = await api("POST", "/schedules", scheduleBody, doctorToken);
    assert.equal(r.status, 201);
    scheduleId = r.body._id;
    assert.equal((await api("POST", "/schedules", { ...scheduleBody, startTime: "09:00" }, adminToken)).status, 409);
    assert.equal((await api("POST", "/schedules", { ...scheduleBody, doctor: other.id }, doctorToken)).status, 403);
    assert.equal((await api("POST", "/schedules", { ...scheduleBody, endTime: "07:00" }, doctorToken)).status, 400);
    const adjacent = await api("POST", "/schedules", { ...scheduleBody, startTime: "11:30", endTime: "12:00" }, adminToken);
    assert.equal(adjacent.status, 201);
    assert.equal((await api("DELETE", `/schedules/${adjacent.body._id}`, undefined, adminToken)).status, 200);
  });
  await t.test("Danh sách ca theo quyền; cập nhật ca; slot theo ca đã khai báo", async () => {
    const list = await api("GET", "/schedules", undefined, doctorToken);
    assert.equal(list.body.length, 1);
    assert.equal((await api("GET", `/schedules?doctor=${other.id}`, undefined, doctorToken)).status, 403);
    assert.equal((await api("GET", `/schedules?doctor=${other.id}`, undefined, adminToken)).body.length, 0);
    const otherToken = token("doctor", other.id);
    assert.equal((await api("PUT", `/schedules/${scheduleId}`, { endTime: "10:30" }, otherToken)).status, 403);
    assert.equal((await api("DELETE", `/schedules/${scheduleId}`, undefined, otherToken)).status, 403);
    assert.equal((await api("PUT", `/schedules/${scheduleId}`, { endTime: "10:30" }, doctorToken)).status, 200);
    const slots = await api("GET", `/doctors/${doctor.id}/slots?date=${day}`);
    assert.equal(slots.body.source, "schedule");
    assert.equal(slots.body.slots.length, 5);
  });
  await t.test("Đặt hẹn, chặn trùng và ngoài ca; slot đã đặt bị loại", async () => {
    const r = await api("POST", "/appointments", { ...bookingBody, status: "completed", result: "giả mạo" });
    assert.equal(r.status, 201);
    appointmentId = r.body._id;
    assert.equal(r.body.status, "pending");
    assert.equal(r.body.result, undefined);
    assert.equal((await api("POST", "/appointments", bookingBody)).status, 409);
    assert.equal((await api("POST", "/appointments", { ...bookingBody, timeSlot: "14:00" })).status, 409);
    assert.ok(!(await api("GET", `/doctors/${doctor.id}/slots?date=${day}`)).body.slots.includes("08:00"));
  });
  await t.test("Cảnh báo khi xóa ca có hẹn; sửa không được làm mất giờ hẹn", async () => {
    const r = await api("DELETE", `/schedules/${scheduleId}`, undefined, doctorToken);
    assert.equal(r.status, 409);
    assert.equal(r.body.details.count, 1);
    assert.equal((await api("PUT", `/schedules/${scheduleId}`, { startTime: "08:30" }, doctorToken)).status, 409);
    assert.equal((await api("GET", "/schedules", undefined, doctorToken)).body[0].startTime, "08:00");
  });
  await t.test("Lịch gửi bác sĩ và lọc/phân trang admin không rò dữ liệu bác sĩ khác", async () => {
    const list = await api("GET", `/appointments/doctor?date=${day}&status=pending`, undefined, doctorToken);
    assert.equal(list.body.length, 1);
    assert.equal((await api("GET", "/appointments/doctor", undefined, token("doctor", other.id))).body.length, 0);
    const admin = await api("GET", `/appointments?doctor=${doctor.id}&date=${day}&status=pending&page=1&limit=1`, undefined, adminToken);
    assert.equal(admin.body.pagination.total, 1);
    assert.equal(admin.body.data.length, 1);
    assert.equal((await api("GET", "/appointments?limit=0", undefined, adminToken)).status, 400);
    assert.equal((await api("GET", "/appointments?status=sai", undefined, adminToken)).status, 400);
  });
  await t.test("Trạng thái hợp lệ, quyền sở hữu, cấm hoàn thành sớm; hủy trả lại slot", async () => {
    const path = `/appointments/${appointmentId}/status`;
    assert.equal((await api("PATCH", path, { status: "confirmed" }, token("doctor", other.id))).status, 403);
    assert.equal((await api("PATCH", path, { status: "completed", result: "Khỏe" }, doctorToken)).status, 409);
    assert.equal((await api("PATCH", path, { status: "confirmed" }, doctorToken)).status, 200);
    assert.equal((await api("PATCH", path, { status: "completed", result: "Khỏe" }, doctorToken)).status, 409);
    assert.equal((await api("PATCH", path, { status: "cancelled" }, adminToken)).status, 200);
    assert.equal((await api("PATCH", path, { status: "confirmed" }, adminToken)).status, 409);
    assert.ok((await api("GET", `/doctors/${doctor.id}/slots?date=${day}`)).body.slots.includes("08:00"));
    assert.equal((await api("DELETE", `/schedules/${scheduleId}`, undefined, doctorToken)).status, 200);
  });
  await t.test("Thêm ca đầu tiên không được làm mất lịch hẹn đã đặt theo giờ mặc định", async () => {
    const booking = await api("POST", "/appointments", { ...bookingBody, timeSlot: "14:00" });
    assert.equal(booking.status, 201);
    assert.equal((await api("POST", "/schedules", scheduleBody, doctorToken)).status, 409);
    await api("PATCH", `/appointments/${booking.body._id}/status`, { status: "cancelled" }, doctorToken);
  });
  await t.test("Ghi kết quả khi hoàn thành; trạng thái cuối không được mở lại", async () => {
    const past = await Appointment.create({ ...bookingBody, date: new Date("2020-01-06"), status: "confirmed" });
    const path = `/appointments/${past.id}/status`;
    assert.equal((await api("PATCH", path, { status: "completed" }, doctorToken)).status, 400);
    const r = await api("PATCH", path, { status: "completed", result: "Đã khám, hẹn tái khám" }, doctorToken);
    assert.equal(r.status, 200);
    assert.equal(r.body.result, "Đã khám, hẹn tái khám");
    assert.equal((await api("PATCH", path, { status: "cancelled" }, adminToken)).status, 409);
  });
  await t.test("Hai request đồng thời chỉ đặt được một lịch hoặc một ca", async () => {
    const pair = await Promise.all([api("POST", "/appointments", { ...bookingBody, timeSlot: "09:00" }), api("POST", "/appointments", { ...bookingBody, timeSlot: "09:00" })]);
    assert.deepEqual(pair.map(r => r.status).sort(), [201, 409]);
    assert.equal(await Appointment.countDocuments({ doctor: doctor._id, date: new Date(day), timeSlot: "09:00", status: "pending" }), 1);
    const pair2 = await Promise.all([api("POST", "/schedules", scheduleBody, doctorToken), api("POST", "/schedules", scheduleBody, doctorToken)]);
    assert.deepEqual(pair2.map(r => r.status).sort(), [201, 409]);
  });
  await t.test("Có thể khai báo ca chủ nhật, bỏ qua khung mặc định; không lộ khóa nội bộ", async () => {
    assert.equal((await api("POST", "/schedules", { ...scheduleBody, date: sunday }, doctorToken)).status, 201);
    assert.equal((await api("GET", `/doctors/${doctor.id}/slots?date=${sunday}`)).body.slots.length, 7);
    assert.equal((await api("GET", "/doctors")).body[0].scheduleLock, undefined);
    assert.equal((await api("GET", "/schedules/not-an-id", undefined, doctorToken)).status, 404);
    assert.equal((await api("DELETE", "/schedules/not-an-id", undefined, doctorToken)).status, 400);
    assert.equal((await api("DELETE", `/schedules/${new mongoose.Types.ObjectId()}`, undefined, doctorToken)).status, 404);
  });
});
