import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import DoctorManagement from "./pages/admin/DoctorManagement";
import AppointmentManagement from "./pages/admin/AppointmentManagement";

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

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="bac-si" element={<DoctorManagement />} />
        <Route path="lich-hen" element={<AppointmentManagement />} />
      </Route>

      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<Schedule />} />
        <Route path="lich-hen" element={<DoctorAppointments />} />
      </Route>

      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<BookAppointment />} />
        <Route path="lich-hen" element={<PatientAppointments />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
