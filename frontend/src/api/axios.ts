import axios from "axios";

// Tên khoá lưu token trong trình duyệt
export const TOKEN_KEY = "dlk_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Gắn token vào mọi request nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gặp 401 (token hết hạn hoặc không hợp lệ) thì xoá token và về trang đăng nhập.
// Bỏ qua khi đang gọi login/register, vì lúc đó 401 nghĩa là sai mật khẩu.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");

    if (status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/dang-nhap") {
        window.location.assign("/dang-nhap");
      }
    }
    return Promise.reject(error);
  }
);

export default api;