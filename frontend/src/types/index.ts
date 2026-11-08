export interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  phone?: string;
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
