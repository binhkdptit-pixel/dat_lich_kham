import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/auth/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import DoctorManagement from "./pages/admin/DoctorManagement";
import AppointmentManagement from "./pages/admin/AppointmentManagement";
import UserManagement from "./pages/admin/UserManagement";

import DoctorLayout from "./layouts/DoctorLayout";
import Schedule from "./pages/doctor/Schedule";
import DoctorAppointments from "./pages/doctor/MyAppointments";

import PatientLayout from "./layouts/PatientLayout";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientAppointments from "./pages/patient/MyAppointments";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dang-nhap" element={<Login />} />
      <Route path="/dang-ky" element={<Register />} />

      {/* Đã đăng nhập là vào được, mọi vai trò */}
      <Route element={<ProtectedRoute />}>
        <Route path="/ho-so" element={<Profile />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bac-si" element={<DoctorManagement />} />
          <Route path="lich-hen" element={<AppointmentManagement />} />
          <Route path="nguoi-dung" element={<UserManagement />} />
        </Route>
      </Route>

      <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]} />}>
        <Route element={<DoctorLayout />}>
          <Route index element={<Schedule />} />
          <Route path="lich-hen" element={<DoctorAppointments />} />
        </Route>
      </Route>

      <Route path="/patient" element={<ProtectedRoute roles={["patient"]} />}>
        <Route element={<PatientLayout />}>
          <Route index element={<BookAppointment />} />
          <Route path="lich-hen" element={<PatientAppointments />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}