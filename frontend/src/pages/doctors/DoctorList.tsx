import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDoctorStore } from "../../stores/doctorStore";
import { useSpecialtyStore } from "../../stores/specialtyStore";
import { EmptyState, LoadingState, Pagination, useToast, usePagination } from "../../components/shared";
import { getErrorMessage } from "../../utils/error";
import "./doctors.css";

const PAGE_SIZE = 9;

export default function DoctorList() {
  const toast = useToast();
  const doctors = useDoctorStore((s) => s.items);
  const loading = useDoctorStore((s) => s.loading);
  const fetchDoctors = useDoctorStore((s) => s.fetchAll);
  const specialties = useSpecialtyStore((s) => s.items);
  const fetchSpecialties = useSpecialtyStore((s) => s.fetchAll);

  const [specialtyId, setSpecialtyId] = useState("");
  const { pageItems, page, totalPages, setPage } = usePagination(doctors, PAGE_SIZE);

  useEffect(() => {
    fetchSpecialties().catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchSpecialties, toast]);

  useEffect(() => {
    fetchDoctors(specialtyId || undefined).catch((err) => toast.error(getErrorMessage(err)));
  }, [specialtyId, fetchDoctors, toast]);

  return (
    <div className="container">
      <h1>Đội ngũ bác sĩ</h1>

      <div className="dl-filter">
        <label htmlFor="specialty-filter">Chuyên khoa:</label>
        <select
          id="specialty-filter"
          value={specialtyId}
          onChange={(e) => {
            setSpecialtyId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả chuyên khoa</option>
          {specialties.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : doctors.length === 0 ? (
        <EmptyState message="Chưa có bác sĩ nào" />
      ) : (
        <>
          <div className="doctor-grid">
            {pageItems.map((d) => (
              <Link key={d._id} to={`/bac-si/${d._id}`} className="doctor-card">
                <h3>{d.user?.name ?? "Bác sĩ"}</h3>
                <p className="doctor-meta">{d.specialty?.name}</p>
                <p className="doctor-meta">{d.experience} năm kinh nghiệm</p>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}