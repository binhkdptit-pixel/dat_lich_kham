import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../../components/booking/booking.css";
import { fetchDoctors, fetchSlots, fetchSpecialties } from "../../api/booking";
import { useAppointmentStore } from "../../store/appointmentStore";
import {
  DoctorLite,
  Specialty,
  doctorInSpecialty,
  errorMessage,
  todayVN,
} from "../../types/appointment";
// STEPS -->	tên 5 bước, dùng để vẽ thanh tiến trình
const STEPS = ["Chuyên khoa", "Bác sĩ", "Ngày & giờ", "Lý do", "Xác nhận"];

// dữ liệu người dùng đã chọn: specialty, doctor
// date, timeSlot, reason, phone
interface Form {
  specialty: Specialty | null;
  doctor: DoctorLite | null;
  date: string;
  timeSlot: string;
  reason: string;
  phone: string;
}

// form rỗng ban đầu, dùng khi khởi tạo và khi bấm "Đặt lịch khác"
const EMPTY: Form = {
  specialty: null,
  doctor: null,
  date: "",
  timeSlot: "",
  reason: "",
  phone: "",
};

export default function BookAppointment() {
  const book = useAppointmentStore((s) => s.book);
  // step -->	dang ở bước nào (0 --> 4)
  const [step, setStep] = useState(0);
  // form -->	toàn bộ lựa chọn của người dùng, gom vào một object
  const [form, setForm] = useState<Form>(EMPTY);
  // specialties, doctors, slots -->	dữ liệu tra cứu từ API --> (để riêng khỏi form)
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<DoctorLite[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  // loading -->	dang tải dữ liệu (danh sách hoặc khung giờ)
  const [loading, setLoading] = useState(false);
  // loadingSlots --> riêng cho việc tải khung giờ (để huỷ lần gọi cũ không làm kẹt loading)
  const [loadingSlots, setLoadingSlots] = useState(false);
  //  slotReq --> số thứ tự lần gọi tải khung giờ, chỉ nhận kết quả của lần mới nhất
  const slotReq = useRef(0);
  // submitting -->	dang gửi yêu cầu đặt lịch
  const [submitting, setSubmitting] = useState(false);
  // error -->	thông báo lỗi đang hiển thị
  const [error, setError] = useState("");
  // done -->	đã đặt thành công, chuyển sang màn hình kết quả
  const [done, setDone] = useState(false);

  // Tải chuyên khoa + bác sĩ một lần
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSpecialties(), fetchDoctors()]) // gọi 2 hàm bên trái bằng Promise.all, rồi lưu kết quả.
      .then(([sp, dr]) => {
        // nếu lỗi thì hiện thông báo, và finally luôn tắt loading
        setSpecialties(sp);
        setDoctors(dr);
      })
      .catch((e) =>
        setError(
          errorMessage(e, "Không tải được danh sách chuyên khoa/bác sĩ"),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // xóa danh sách giờ cũ, được gọi ở hai nơi : useEffect thứ 2 và nhánh xử lý lỗi 409.
  const loadSlots = (doctorId: string, date: string) => {
    const id = ++slotReq.current; //  đánh số lần gọi này
    setLoadingSlots(true);
    setSlots([]);
    fetchSlots(doctorId, date) // gọi fetchSlots
      .then((s) => {
        if (id === slotReq.current) setSlots(s); // lưu kết quả vào slots (bỏ qua nếu đã có lần gọi mới hơn)
      })
      .catch((e) => {
        if (id === slotReq.current)
          setError(errorMessage(e, "Không tải được khung giờ"));
      })
      .finally(() => {
        if (id === slotReq.current) setLoadingSlots(false);
      });
  };

  // Đổi ngày hoặc bác sĩ --> tải lại khung giờ và RESET giờ đã chọn
  useEffect(() => {
    if (form.doctor && form.date) loadSlots(form.doctor._id, form.date);
    else {
      // nếu thiếu 1 trong 2 thì xóa danh sách giờ
      slotReq.current++; // huỷ kết quả của lần gọi đang chờ (nếu có)
      setSlots([]);
      setLoadingSlots(false);
    }
  }, [form.doctor?._id, form.date]);

  // hàm cập nhật, mỗi lần gọi nó xóa lỗi cũ rồi gộp patch vào form
  const set = (patch: Partial<Form>) => {
    setError("");
    setForm((f) => ({ ...f, ...patch }));
  };

  // valid --> mảng 5 điều kiện, mỗi phần tử ứng với một bước.
  // Bước hiện tại hợp lệ thì mới cho bấm "Tiếp"
  // 0 -->	đã chọn chuyên khoa
  // 1 -->	đã chọn bác sĩ
  // 2 -->	đã chọn cả ngày lẫn giờ
  // 3 -->	lý do không rỗng (sau khi trim)
  // 4 --> 	Luôn đúng
  const valid = [
    !!form.specialty,
    !!form.doctor,
    !!form.date && !!form.timeSlot,
    form.reason.trim().length > 0,
    true,
  ][step];

  // gửi đặt lịch
  const submit = async () => {
    if (!form.doctor) return;
    setSubmitting(true); // bật submitting, xóa lỗi
    setError("");
    try {
      await book({
        // gọi book với doctor là id và reason đã cắt khoảng trắng.
        doctor: form.doctor._id,
        date: form.date,
        timeSlot: form.timeSlot,
        reason: form.reason.trim(),
        // sdt chỉ gửi khi có người nhập...
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      // thành công thì setDone(true).
      setDone(true);
      //thất bại thì hiện lỗi
    } catch (e: any) {
      if (e?.response?.status === 409) {
        // có người đặt trước: quay lại bước chọn giờ và tải lại khung giờ còn trống
        set({ timeSlot: "" });
        setStep(2);
        if (form.doctor) loadSlots(form.doctor._id, form.date);
      }
      setError(errorMessage(e, "Đặt lịch thất bại"));
    } finally {
      setSubmitting(false);
    }
  };
  // các bước thực hiện đặt lịchh
  // 0 --> lưới nút chuyên khoa, chọn xong reset bác sĩ, ngày, giờ..
  // 1 --> chỉ hiện bác sĩ thuộc chuyên khoa đã chọn ( lọc qua doctorInSpecialty) --> đổi bác sĩ thì reset ngày, giờ
  // 2 --> (min={todayVn()}) --> chặn ngày đã qua, đổi ngày thì reset giờ..
  // 3 --> nhập lý do ( <= 500 ký tự) và sdt ( khong bắt buộc).
  // 4 --> tóm tắt thông tin + nút xác nhận đặt lịch..
  if (done) {
    return (
      <>
        <h2>Đặt lịch khám</h2>
        <div className="bk-toast ok">
          Đặt lịch thành công! Lịch của bạn đang chờ bác sĩ xác nhận.
        </div>
        <div className="bk-actions" style={{ justifyContent: "flex-start" }}>
          <Link to="/patient/lich-hen" className="bk-btn bk-btn-primary">
            Xem lịch hẹn của tôi
          </Link>
          <button
            className="bk-btn"
            onClick={() => {
              setForm(EMPTY); // đặt lịch khác --> reset form về EMPTY --> nhảy về bước 0.
              setStep(0);
              setDone(false);
            }}
          >
            Đặt lịch khác
          </button>
        </div>
      </>
    );
  }

  const doctorsOfSpecialty = form.specialty
    ? doctors.filter((d) => doctorInSpecialty(d, form.specialty!))
    : [];

  return (
    <>
      <h2>Đặt lịch khám</h2>
      <ol className="bk-steps">
        {STEPS.map((name, i) => (
          <li
            key={name}
            className={i === step ? "active" : i < step ? "done" : ""}
          >
            {i + 1}. {name}
          </li>
        ))}
      </ol>

      {error && <div className="bk-toast err">{error}</div>}

      <div className="bk-card">
        {step === 0 && (
          <>
            <h3>Chọn chuyên khoa</h3>
            {loading && <div className="bk-loading">Đang tải...</div>}
            {!loading && specialties.length === 0 && (
              <div className="bk-empty">Chưa có chuyên khoa nào.</div>
            )}
            <div className="bk-grid">
              {specialties.map((s) => (
                <button
                  key={s._id}
                  className={`bk-choice ${form.specialty?._id === s._id ? "selected" : ""}`}
                  // đổi chuyên khoa thì các lựa chọn phía sau không còn đúng -> reset
                  onClick={() =>
                    set({ specialty: s, doctor: null, date: "", timeSlot: "" })
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3>Chọn bác sĩ ({form.specialty?.name})</h3>
            {doctorsOfSpecialty.length === 0 && (
              <div className="bk-empty">Chuyên khoa này chưa có bác sĩ.</div>
            )}
            <div className="bk-grid">
              {doctorsOfSpecialty.map((d) => (
                <button
                  key={d._id}
                  className={`bk-choice ${form.doctor?._id === d._id ? "selected" : ""}`}
                  onClick={() => set({ doctor: d, date: "", timeSlot: "" })}
                >
                  {d.name}
                  <small>{d.specialty}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Chọn ngày và giờ khám</h3>
            <div className="bk-field">
              <label htmlFor="bk-date">Ngày khám</label>
              <input
                id="bk-date"
                type="date"
                min={todayVN()}
                value={form.date}
                onChange={(e) => set({ date: e.target.value, timeSlot: "" })}
              />
            </div>
            {form.date && loadingSlots && (
              <div className="bk-loading">Đang tải khung giờ...</div>
            )}
            {form.date && !loadingSlots && slots.length === 0 && (
              <div className="bk-empty">
                Không còn khung giờ trống trong ngày này, hãy chọn ngày khác.
              </div>
            )}
            <div className="bk-grid">
              {slots.map((t) => (
                <button
                  key={t}
                  className={`bk-choice ${form.timeSlot === t ? "selected" : ""}`}
                  onClick={() => set({ timeSlot: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Lý do khám</h3>
            <div className="bk-field">
              <label htmlFor="bk-reason">Triệu chứng / lý do</label>
              <textarea
                id="bk-reason"
                rows={4}
                maxLength={500}
                value={form.reason}
                onChange={(e) => set({ reason: e.target.value })}
              />
            </div>
            <div className="bk-field">
              <label htmlFor="bk-phone">
                Số điện thoại liên hệ (bỏ trống nếu đã có trong hồ sơ)
              </label>
              <input
                id="bk-phone"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                inputMode="tel"
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3>Xác nhận thông tin</h3>
            <table className="bk-table">
              <tbody>
                <tr>
                  <th>Chuyên khoa</th>
                  <td>{form.specialty?.name}</td>
                </tr>
                <tr>
                  <th>Bác sĩ</th>
                  <td>{form.doctor?.name}</td>
                </tr>
                <tr>
                  <th>Ngày</th>
                  <td>{form.date}</td>
                </tr>
                <tr>
                  <th>Giờ</th>
                  <td>{form.timeSlot}</td>
                </tr>
                <tr>
                  <th>Lý do</th>
                  <td>{form.reason}</td>
                </tr>
                {form.phone && (
                  <tr>
                    <th>SĐT</th>
                    <td>{form.phone}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        <div className="bk-actions">
          <button
            className="bk-btn"
            disabled={step === 0 || submitting}
            onClick={() => setStep(step - 1)}
          >
            Quay lại
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="bk-btn bk-btn-primary"
              disabled={!valid}
              onClick={() => setStep(step + 1)}
            >
              Tiếp
            </button>
          ) : (
            <button
              className="bk-btn bk-btn-primary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
