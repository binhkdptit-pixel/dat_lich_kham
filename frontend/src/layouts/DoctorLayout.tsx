import SidebarLayout from "../components/SidebarLayout";

export default function DoctorLayout() {
  return (
    <SidebarLayout
      title="Bác sĩ"
      menu={[
        { to: "/doctor", label: "Lịch làm việc", end: true },
        { to: "/doctor/lich-hen", label: "Lịch hẹn của tôi" },
      ]}
    />
  );
}
