# dat_lich_kham

Web đặt lịch khám bệnh.

- `frontend/`: React + TypeScript (Vite) - 3 khu vực: `/admin`, `/doctor`, `/patient` - chạy ở http://localhost:5173
- `backend/`: Node.js + Express + TypeScript + MongoDB (Mongoose) - chạy ở http://localhost:5000

## Chạy dự án

Mở 2 terminal trong VS Code:

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env     # (Windows: copy .env.example .env)
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Kiểm tra: mở http://localhost:5173 -> trang chủ sẽ hiện trạng thái kết nối API.
