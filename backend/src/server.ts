import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Không kết nối được DB:", err.message);
    process.exit(1);
  });
