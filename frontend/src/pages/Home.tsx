import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function Home() {
  const [status, setStatus] = useState("Đang kiểm tra kết nối API...");

  useEffect(() => {
    api
      .get("/health")
      .then(() => setStatus("Kết nối backend thành công ✅"))
      .catch(() => setStatus("Không kết nối được backend ❌"));
  }, []);

  return (
    <div className="container">
      <h1>Hệ thống đặt lịch khám bệnh</h1>
      <p>{status}</p>
      <p>Chọn vai trò để vào trang quản lý (tạm thời chưa có đăng nhập):</p>
      <div className="role-cards">
        <Link to="/admin" className="card">Quản trị viên</Link>
        <Link to="/doctor" className="card">Bác sĩ</Link>
        <Link to="/patient" className="card">Bệnh nhân</Link>
      </div>
    </div>
  );
}
