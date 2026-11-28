import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import api from "../../api/axios";
import { ConfirmModal, DataTable, Pagination, useToast, usePagination } from "../../components/shared";
import type { Column } from "../../components/shared";
import { useDoctorStore } from "../../stores/doctorStore";
import { useSpecialtyStore } from "../../stores/specialtyStore";
import type { Doctor } from "../../types";
import { getErrorMessage } from "../../utils/error";
import "../doctors/doctors.css";

const PAGE_SIZE = 10;

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialty: string;
  experience: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  specialty: "",
  experience: "0",
  description: "",
};

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`dm-field${full ? " dm-full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function DoctorManagement() {
  const toast = useToast();
  const doctors = useDoctorStore((s) => s.items);
  const loading = useDoctorStore((s) => s.loading);
  const fetchDoctors = useDoctorStore((s) => s.fetchAll);
  const specialties = useSpecialtyStore((s) => s.items);
  const fetchSpecialties = useSpecialtyStore((s) => s.fetchAll);
  const { pageItems, page, totalPages, setPage } = usePagination(doctors, PAGE_SIZE);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null); // null nghĩa là đang thêm mới
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSpecialties(true).catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchSpecialties, toast]);

  useEffect(() => {
    fetchDoctors().catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchDoctors, toast]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, specialty: specialties[0]?._id ?? "" });
    setShowForm(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.user?.name ?? "",
      email: "",
      password: "",
      phone: "",
      specialty: d.specialty?._id ?? "",
      experience: String(d.experience ?? 0),
      description: d.description ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const update =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập họ tên bác sĩ");
      return;
    }
    if (!form.specialty) {
      toast.error("Vui lòng chọn chuyên khoa");
      return;
    }
    if (!editing && (!form.email.trim() || form.password.length < 6)) {
      toast.error("Cần nhập email và mật khẩu tối thiểu 6 ký tự");
      return;
    }

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty,
      experience: Number(form.experience) || 0,
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/doctors/${editing._id}`, payload);
        toast.success("Đã cập nhật bác sĩ");
      } else {
        await api.post("/doctors", {
          ...payload,
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        });
        toast.success("Đã thêm bác sĩ");
      }
      closeForm();
      await fetchDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/doctors/${deleting._id}`);
      toast.success("Đã xoá bác sĩ");
      setDeleting(null);
      await fetchDoctors();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Doctor>[] = [
    { key: "name", header: "Họ tên", render: (d) => d.user?.name ?? "—" },
    { key: "specialty", header: "Chuyên khoa", render: (d) => d.specialty?.name ?? "—" },
    { key: "experience", header: "Kinh nghiệm", width: "120px", render: (d) => `${d.experience} năm` },
    {
      key: "actions",
      header: "Thao tác",
      width: "160px",
      render: (d) => (
        <>
          <button type="button" className="dm-link-btn" onClick={() => openEdit(d)}>
            Sửa
          </button>
          <button type="button" className="dm-link-btn dm-danger-text" onClick={() => setDeleting(d)}>
            Xoá
          </button>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="dm-toolbar">
        <h2>Quản lý bác sĩ</h2>
        {!showForm && (
          <button type="button" className="ui-btn ui-btn--primary" onClick={openCreate}>
            + Thêm bác sĩ
          </button>
        )}
      </div>

      {showForm && (
        <form className="dm-form" onSubmit={submit}>
          <h3 className="dm-full">{editing ? "Sửa bác sĩ" : "Thêm bác sĩ mới"}</h3>

          {specialties.length === 0 && (
            <p className="dm-hint dm-full">Chưa có chuyên khoa nào. Hãy thêm chuyên khoa trước khi thêm bác sĩ.</p>
          )}

          <Field label="Họ tên *">
            <input value={form.name} onChange={update("name")} />
          </Field>

          <Field label="Chuyên khoa *">
            <select value={form.specialty} onChange={update("specialty")}>
              <option value="">-- Chọn chuyên khoa --</option>
              {specialties.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {!editing && (
            <>
              <Field label="Email *">
                <input type="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Mật khẩu * (tối thiểu 6 ký tự)">
                <input type="password" value={form.password} onChange={update("password")} />
              </Field>
              <Field label="Số điện thoại">
                <input value={form.phone} onChange={update("phone")} />
              </Field>
            </>
          )}

          <Field label="Số năm kinh nghiệm">
            <input type="number" min={0} max={60} value={form.experience} onChange={update("experience")} />
          </Field>

          <Field label="Mô tả" full>
            <textarea value={form.description} onChange={update("description")} />
          </Field>

          <div className="dm-actions">
            <button type="button" className="ui-btn" onClick={closeForm} disabled={saving}>
              Huỷ
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(d) => d._id}
        loading={loading}
        emptyText="Chưa có bác sĩ nào"
      />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmModal
        open={!!deleting}
        danger
        title="Xoá bác sĩ?"
        message={`Xoá "${deleting?.user?.name ?? ""}"? Tài khoản đăng nhập của bác sĩ này cũng sẽ bị xoá.`}
        confirmText="Xoá"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}