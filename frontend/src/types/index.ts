export interface Specialty {
  _id: string;
  name: string;
  description?: string;
}

// API công khai chỉ trả tên của User và Specialty, không trả email hay số điện thoại
export interface Doctor {
  _id: string;
  user: { _id?: string; name: string; phone?: string; email?: string };
  specialty: { _id: string; name: string };
  experience: number;
  description?: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  _id: string;
  patientName: string;
  phone: string;
  doctor: Doctor | string;
  date: string;
  timeSlot: string;
  reason?: string;
  status: AppointmentStatus;
}

export type Role = "patient" | "doctor" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}