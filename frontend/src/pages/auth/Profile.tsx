import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";
import { getErrorMessage } from "../../utils/error";
import { homeByRole, roleLabel } from "../../utils/role";
import "./auth.css";

// Hồ sơ cá nhân dùng chung cho cả 3 vai trò
export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [infoMsg, setInfoMsg] = useState("");
  const [infoErr, setInfoErr] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [saving, setSaving] = useState(false);

  // ProtectedRoute đã chặn trường hợp chưa đăng nhập, đây chỉ là chốt an toàn
  if (!user) return null;

  const saveInfo = async (e: FormEvent) => {
    e.preventDefault();
    setInfoMsg("");
    setInfoErr("");
    setSaving(true);
    try {
      const res = await api.put<{ user: User }>("/auth/me", { name, email, phone });
      updateUser(res.data.user);
      setInfoMsg("Đã lưu thông tin");
    } catch (err) {
      setInfoErr(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    if (newPassword !== confirmPassword) {
      setPwErr("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<{ user: User }>("/auth/me", {
        currentPassword,
        password: newPassword,
      });
      updateUser(res.data.user);
      setPwMsg("Đã đổi mật khẩu");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwErr(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wide">
        <p>
          <Link to={homeByRole(user.role)}>← Về khu vực của tôi</Link>
        </p>
        <div>
          <h2>Hồ sơ cá nhân</h2>
          <p className="auth-muted">Vai trò: {roleLabel(user.role)}</p>
        </div>

        <form className="auth-card" onSubmit={saveInfo}>
          <h3>Thông tin</h3>
          <label>
            Họ tên
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Số điện thoại
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
          </label>
          {infoErr && <p className="auth-error">{infoErr}</p>}
          {infoMsg && <p className="auth-success">{infoMsg}</p>}
          <button type="submit" disabled={saving}>Lưu thông tin</button>
        </form>

        <form className="auth-card" onSubmit={changePassword}>
          <h3>Đổi mật khẩu</h3>
          <label>
            Mật khẩu hiện tại
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </label>
          <label>
            Mật khẩu mới (tối thiểu 6 ký tự)
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </label>
          <label>
            Nhập lại mật khẩu mới
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </label>
          {pwErr && <p className="auth-error">{pwErr}</p>}
          {pwMsg && <p className="auth-success">{pwMsg}</p>}
          <button type="submit" disabled={saving}>Đổi mật khẩu</button>
        </form>

        <button type="button" className="auth-logout" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}