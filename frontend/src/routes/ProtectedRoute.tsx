import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { homeByRole } from "../utils/role";

interface Props {
  roles?: Role[]; // không truyền thì chỉ cần đã đăng nhập
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="container">Đang tải...</p>;
  }

  // Chưa đăng nhập: chuyển về trang đăng nhập, nhớ trang định vào để quay lại sau
  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }

  // Đã đăng nhập nhưng sai vai trò: đưa về khu vực của chính họ
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeByRole(user.role)} replace />;
  }

  return <Outlet />;
}