import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { ConfirmModal, DataTable, Pagination, useToast } from "../../components/shared";
import type { Column } from "../../components/shared";
import type { Role, User } from "../../types";
import { getErrorMessage } from "../../utils/error";
import { roleLabel } from "../../utils/role";
import "./user-management.css";

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const FILTER_OPTIONS: { value: "" | Role; label: string }[] = [
  { value: "", label: "Tất cả vai trò" },
  { value: "patient", label: "Bệnh nhân" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "admin", label: "Quản trị viên" },
];

// Form thêm mới (user không có) hoặc sửa (có user)
function UserFormModal({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  user?: User;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "patient");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Bác sĩ và chính mình không đổi được vai trò ở đây
  const roleLocked = isSelf || user?.role === "doctor";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (user) {
        await api.put(`/users/${user._id}`, { name, email, phone, role });
        toast.success("Đã cập nhật người dùng");
      } else {
        await api.post("/users", {
          name,
          email,
          phone: phone || undefined,
          password,
          role,
        });
        toast.success("Đã tạo người dùng");
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="ui-modal-backdrop" onClick={() => !saving && onClose()}>
      <form
        className="ui-modal um-form"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h3>{user ? "Sửa người dùng" : "Thêm người dùng"}</h3>
        <label>
          Họ tên
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Số điện thoại
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
        </label>
        {!user && (
          <label>
            Mật khẩu (tối thiểu 6 ký tự)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
        )}
        <label>
          Vai trò
          <select
            value={role}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as Role)}
            disabled={roleLocked}
          >
            <option value="patient">Bệnh nhân</option>
            <option value="admin">Quản trị viên</option>
            {user?.role === "doctor" && <option value="doctor">Bác sĩ</option>}
          </select>
        </label>
        {error && <p className="um-error">{error}</p>}
        <div className="ui-modal-actions">
          <button type="button" className="ui-btn" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UserManagement() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [filterRole, setFilterRole] = useState<"" | Role>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ user?: User } | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<UserListResponse>("/users", {
        params: { role: filterRole || undefined, page, limit: PAGE_SIZE },
      });
      // Xoá hết người ở trang cuối thì lùi về trang trước
      if (res.data.users.length === 0 && page > 1) {
        setPage(page - 1);
      } else {
        setData(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterRole, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${toDelete._id}`);
      toast.success("Đã xoá người dùng");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    { key: "name", header: "Họ tên" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Số điện thoại", render: (u) => u.phone || "—" },
    { key: "role", header: "Vai trò", render: (u) => roleLabel(u.role) },
    {
      key: "isActive",
      header: "Trạng thái",
      render: (u) => (u.isActive ? "Đang hoạt động" : "Đã khoá"),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "240px",
      render: (u) => {
        const isSelf = u._id === me?._id;
        return (
          <div className="um-actions">
            <button type="button" className="ui-btn" onClick={() => setEditing({ user: u })}>
              Sửa
            </button>
            <button
              type="button"
              className="ui-btn"
              onClick={() => toggleActive(u)}
              disabled={isSelf}
            >
              {u.isActive ? "Khoá" : "Mở khoá"}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--danger"
              onClick={() => setToDelete(u)}
              disabled={isSelf}
            >
              Xoá
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <h2>Quản lý người dùng</h2>

      <div className="um-toolbar">
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value as "" | Role);
            setPage(1);
          }}
        >
          {FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" className="ui-btn ui-btn--primary" onClick={() => setEditing({})}>
          + Thêm người dùng
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={data?.users ?? []}
        rowKey={(u) => u._id}
        loading={loading}
        emptyText="Không có người dùng nào"
      />

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      {editing && (
        <UserFormModal
          user={editing.user}
          isSelf={editing.user?._id === me?._id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Xoá người dùng"
        message={`Xoá tài khoản "${toDelete?.name ?? ""}"? Thao tác này không thể hoàn tác.`}
        confirmText="Xoá"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}