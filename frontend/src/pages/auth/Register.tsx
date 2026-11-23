import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/error";
import { homeByRole } from "../../utils/role";
import "./auth.css";

export default function Register() {
  const { user, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Đã đăng nhập thì không cần đăng ký nữa
  if (user) return <Navigate to={homeByRole(user.role)} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // Server luôn gán vai trò bệnh nhân; khi user được cập nhật, Navigate ở trên sẽ chuyển trang
      await register({ name, email, password, phone: phone || undefined });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Đăng ký bệnh nhân</h2>
        <label>
          Họ tên
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Số điện thoại (không bắt buộc)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
        </label>
        <label>
          Mật khẩu (tối thiểu 6 ký tự)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <label>
          Nhập lại mật khẩu
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Đang đăng ký..." : "Đăng ký"}
        </button>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}