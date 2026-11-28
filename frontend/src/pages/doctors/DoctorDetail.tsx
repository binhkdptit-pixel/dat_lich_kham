import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import { LoadingState } from "../../components/shared";
import type { Doctor } from "../../types";
import { getErrorMessage } from "../../utils/error";
import "./doctors.css";

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<Doctor>(`/doctors/${id}`)
      .then((res) => setDoctor(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <LoadingState />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="container">
        <p>{error || "Không tìm thấy bác sĩ"}</p>
        <Link to="/bac-si">← Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/bac-si">← Danh sách bác sĩ</Link>
      <div className="card doctor-detail">
        <h1>{doctor.user?.name ?? "Bác sĩ"}</h1>
        <p>
          <strong>Chuyên khoa:</strong> {doctor.specialty?.name}
        </p>
        <p>
          <strong>Kinh nghiệm:</strong> {doctor.experience} năm
        </p>
        {doctor.description && <p>{doctor.description}</p>}
        <Link to="/patient" className="doctor-book-btn">
          Đặt lịch khám
        </Link>
      </div>
    </div>
  );
}