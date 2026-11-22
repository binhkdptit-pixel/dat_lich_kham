# API Đặt lịch khám và thống kê

Quy ước chung: ngày `YYYY-MM-DD`, giờ `HH:mm` (giờ Việt Nam). Lỗi luôn dạng `{ "message": "..." }`.
Cần header `Authorization: Bearer <token>` cho mọi API dưới đây.
`status`: `pending` -> `confirmed` -> `completed`, hoặc `cancelled`.

Một lịch hẹn trả về:

```json
{
  "_id": "...",
  "patient": "<userId>",
  "patientName": "Nguyễn Văn An",
  "phone": "0900000010",
  "doctor": "<doctorId>",
  "date": "2026-12-01T00:00:00.000Z",
  "timeSlot": "08:30",
  "reason": "Đau đầu",
  "status": "pending",
  "result": null
}
```

`date` luôn là 00:00 UTC của đúng ngày khám: lấy 10 ký tự đầu là `YYYY-MM-DD`.

| Method | Đường dẫn                    | Quyền                            | Mô tả                                      |
| ------ | ---------------------------- | -------------------------------- | ------------------------------------------ |
| POST   | /api/appointments            | bệnh nhân                        | Đặt lịch                                   |
| GET    | /api/appointments/my?status= | bệnh nhân                        | Lịch của mình                              |
| GET    | /api/appointments/:id        | chủ lịch, bác sĩ của lịch, admin | Chi tiết                                   |
| PUT    | /api/appointments/:id        | bệnh nhân (của mình)             | Sửa lý do / đổi ngày giờ khi còn `pending` |
| PATCH  | /api/appointments/:id/cancel | bệnh nhân (của mình), admin      | Huỷ                                        |
| DELETE | /api/appointments/:id        | bệnh nhân (của mình), admin      | Xoá lịch đã huỷ                            |
| GET    | /api/stats                   | admin                            | Thống kê                                   |

## POST /api/appointments

Body: `{ "doctor": "<doctorId>", "date": "2026-12-01", "timeSlot": "08:30", "reason": "Đau đầu", "phone": "0900000010" }`
`phone` không bắt buộc nếu tài khoản đã có số điện thoại. Server tự gán `patient`, `status = pending`.

- 201: lịch vừa tạo
- 400: dữ liệu sai | 401: chưa đăng nhập | 403: không phải bệnh nhân | 404: không có bác sĩ
- 409: khung giờ đã có người đặt / đã qua / ngoài ca làm việc

## PUT /api/appointments/:id

Body (gửi trường nào sửa trường đó): `{ "date": "2026-12-02", "timeSlot": "09:00", "reason": "..." }`

- 200: lịch sau khi sửa | 403: không phải lịch của mình | 409: không còn `pending` hoặc khung giờ mới không trống

## PATCH /api/appointments/:id/cancel

Không body. 200: lịch với `status = cancelled` | 409: đã hoàn thành hoặc đã huỷ.

## DELETE /api/appointments/:id

200: `{ "message": "Đã xoá lịch hẹn" }` | 409: lịch chưa huỷ.

## GET /api/stats

```json
{
  "doctors": 3,
  "patients": 3,
  "total": 6,
  "appointments": {
    "pending": 2,
    "confirmed": 2,
    "completed": 1,
    "cancelled": 1
  },
  "today": [
    /* lịch hôm nay, đã populate doctor, sắp theo giờ */
  ]
}
```
