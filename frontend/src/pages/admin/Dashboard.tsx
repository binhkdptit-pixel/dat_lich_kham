import { useEffect, useState } from "react";
import "../../components/booking/booking.css";
import api from "../../api/axios";
import { MOCK_DOCTORS, USE_MOCK } from "../../api/booking";
import { Column, DataTable, StatusBadge } from "../../components/shared";
import {
  AppointmentItem,
  AppointmentStatus,
  STATUS_LABEL,
  errorMessage,
  todayVN,
  toAppointmentItem,
} from "../../types/appointment";

interface Stats {
  doctors: number; // số bác sĩ
  patients: number; //  số bệnh nhân
  total: number; // tổng số lịch hẹn
  appointments: Record<AppointmentStatus, number>; // số lịch theo từng trạng thái (Record<AppointmentStatus, number>)
  today: AppointmentItem[]; // danh sách lịch hôm nay
}

// dữ liệu giả cho chế độ VITE_USE_MOCK=true (chưa có lịch hẹn thật trong database)
const MOCK_STATS: Stats = {
  doctors: 3,
  patients: 12,
  total: 6,
  appointments: { pending: 2, confirmed: 2, completed: 1, cancelled: 1 },
  today: [
    {
      _id: "t1",
      doctor: MOCK_DOCTORS[0],
      date: todayVN(),
      timeSlot: "08:00",
      reason: "Đau đầu kéo dài",
      status: "pending",
      patientName: "Nguyễn Văn An",
      phone: "0900000020",
    },
    {
      _id: "t2",
      doctor: MOCK_DOCTORS[1],
      date: todayVN(),
      timeSlot: "09:30",
      reason: "Khám định kỳ cho bé",
      status: "confirmed",
      patientName: "Trần Thị Bình",
      phone: "0900000030",
    },
    {
      _id: "t3",
      doctor: MOCK_DOCTORS[2],
      date: todayVN(),
      timeSlot: "16:00",
      reason: "Mệt mỏi",
      status: "confirmed",
      patientName: "Lê Minh Châu",
      phone: "0900000040",
    },
  ],
};

const COLUMNS: Column<AppointmentItem>[] = [
  { key: "timeSlot", header: "Giờ", width: "80px" },
  {
    key: "patient",
    header: "Bệnh nhân",
    render: (a) => (
      <>
        {a.patientName}
        <br />
        <small>{a.phone}</small>
      </>
    ),
  },
  { key: "doctor", header: "Bác sĩ", render: (a) => a.doctor.name },
  { key: "reason", header: "Lý do" },
  {
    key: "status",
    header: "Trạng thái",
    render: (a) => <StatusBadge status={a.status} />,
  },
];

export default function Dashboard() {
  // stats -->  dữ liệu thống kê, ban đầu null
  const [stats, setStats] = useState<Stats | null>(null);
  // error -->  thông báo lỗi nếu tải thất bại
  const [error, setError] = useState("");
  // loading --> đang tải, ban đầu true
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setStats(MOCK_STATS);
      setLoading(false);
      return;
    }
    api
      .get("/stats") // chỉ admin gọi được: giao diện do ProtectedRoute của A chặn, backend chặn thật bằng authorize
      .then(({ data }) =>
        setStats({
          ...data,
          today: (data.today as any[]).map(toAppointmentItem),
        }),
      )
      .catch((e) => setError(errorMessage(e, "Không tải được thống kê")))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="bk-toast err">{error}</div>;

  const cards: { label: string; value: number }[] = stats
    ? [
        // danh sách thẻ số liệu, gồm 3 thẻ cố định (Bác sĩ, Bệnh nhân, Tổng lịch hẹn)
        { label: "Bác sĩ", value: stats.doctors },
        { label: "Bệnh nhân", value: stats.patients },
        { label: "Tổng lịch hẹn", value: stats.total },
        ...(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => ({
          label: STATUS_LABEL[s],
          value: stats.appointments[s] ?? 0,
        })),
      ]
    : [];

  return (
    <>
      <h2>Tổng quan</h2>

      {stats && (
        <div className="bk-stats">
          {cards.map((c) => (
            <div className="bk-stat" key={c.label}>
              <b>{c.value}</b>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      )}

      <h3>Lịch hẹn hôm nay</h3>
      <DataTable
        columns={COLUMNS}
        rows={stats?.today ?? []}
        rowKey={(a) => a._id}
        loading={loading}
        emptyText="Hôm nay chưa có lịch hẹn nào."
      />
    </>
  );
}
