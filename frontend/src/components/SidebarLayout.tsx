import { NavLink, Outlet, Link } from "react-router-dom";

export interface MenuItem {
  to: string;
  label: string;
  end?: boolean;
}

interface Props {
  title: string;
  menu: MenuItem[];
}

export default function SidebarLayout({ title, menu }: Props) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>{title}</h3>
        {menu.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>
            {m.label}
          </NavLink>
        ))}
        <Link to="/" className="back-home">← Về trang chọn vai trò</Link>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
