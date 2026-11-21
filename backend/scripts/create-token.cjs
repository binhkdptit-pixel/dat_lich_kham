require("dotenv/config");
const { createHmac } = require("node:crypto");
const [role, doctorId] = process.argv.slice(2);
const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32) throw new Error("Cần AUTH_SECRET ít nhất 32 ký tự trong .env");
if (!["admin", "doctor"].includes(role) || (role === "doctor" && !/^[a-f\d]{24}$/i.test(doctorId || ""))) throw new Error("Cách dùng: npm run token -- admin | npm run token -- doctor <doctorId>");
// Chạy trong terminal của người phát triển; không cung cấp API phát token tự do.
const payload = Buffer.from(JSON.stringify({ role, ...(role === "doctor" ? { doctorId: doctorId.toLowerCase() } : {}), exp: Math.floor(Date.now() / 1000) + 8 * 3600 })).toString("base64url");
console.log(`${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`);
