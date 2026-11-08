import SidebarLayout from "../components/SidebarLayout";

export default function AdminLayout() {
  return (
    <SidebarLayout
      title="Quản trị viên"
      menu={[
        { to: "/admin", label: "Tổng quan", end: true },
        { to: "/admin/bac-si", label: "Quản lý bác sĩ" },
        { to: "/admin/lich-hen", label: "Quản lý lịch hẹn" },
      ]}
    />
  );
}
