import SidebarLayout from "../components/SidebarLayout";

export default function PatientLayout() {
  return (
    <SidebarLayout
      title="Bệnh nhân"
      menu={[
        { to: "/patient", label: "Đặt lịch khám", end: true },
        { to: "/patient/lich-hen", label: "Lịch hẹn của tôi" },
      ]}
    />
  );
}
