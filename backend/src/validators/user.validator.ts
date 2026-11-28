import { body, param, query } from "express-validator";

const ROLES = ["patient", "doctor", "admin"];

// Danh sách người dùng (admin): lọc theo vai trò, phân trang
export const listUsersRules = [
  query("role").optional().isIn(ROLES).withMessage("Vai trò không hợp lệ"),
  query("page").optional().isInt({ min: 1 }).withMessage("page phải là số nguyên từ 1"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit từ 1 đến 50"),
];

// Mã người dùng trên đường dẫn
export const idParamRules = [
  param("id").isMongoId().withMessage("Mã người dùng không hợp lệ"),
];

// Tạo người dùng (admin)
export const createUserRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Họ tên là bắt buộc")
    .isLength({ max: 100 }).withMessage("Họ tên tối đa 100 ký tự"),
  body("email")
    .trim()
    .isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 }).withMessage("Mật khẩu tối thiểu 6 ký tự"),
  body("phone")
    .optional()
    .isString().withMessage("Số điện thoại phải là chuỗi")
    .isLength({ max: 15 }).withMessage("Số điện thoại tối đa 15 ký tự"),
  body("role")
    .optional()
    .isIn(ROLES).withMessage("Vai trò không hợp lệ"),
];

// Sửa người dùng (admin): chỉ sửa các trường được gửi lên
export const updateUserRules = [
  ...idParamRules,
  body("name")
    .optional()
    .isString().withMessage("Họ tên phải là chuỗi")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Họ tên từ 1 đến 100 ký tự"),
  body("email")
    .optional()
    .isEmail().withMessage("Email không hợp lệ"),
  body("phone")
    .optional()
    .isString().withMessage("Số điện thoại phải là chuỗi")
    .isLength({ max: 15 }).withMessage("Số điện thoại tối đa 15 ký tự"),
  body("role")
    .optional()
    .isIn(ROLES).withMessage("Vai trò không hợp lệ"),
  body("isActive")
    .optional()
    .isBoolean().withMessage("isActive phải là true hoặc false"),
];