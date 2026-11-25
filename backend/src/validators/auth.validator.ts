import { body } from "express-validator";

// Đăng ký
export const registerRules = [
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
];

// Đăng nhập
export const loginRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .notEmpty().withMessage("Vui lòng nhập mật khẩu"),
];

// Cập nhật hồ sơ (không bắt buộc)
export const updateMeRules = [
  body("name")
    .optional()
    .isString().withMessage("Họ tên phải là chuỗi")
    .bail()
    .isLength({ min: 1, max: 100 }).withMessage("Họ tên từ 1 đến 100 ký tự"),
  body("email")
    .optional()
    .isEmail().withMessage("Email không hợp lệ"),
  body("phone")
    .optional()
    .isString().withMessage("Số điện thoại phải là chuỗi")
    .isLength({ max: 15 }).withMessage("Số điện thoại tối đa 15 ký tự"),
  body("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Mật khẩu mới tối thiểu 6 ký tự"),

  // Đổi mật khẩu thì bắt buộc nhập mật khẩu hiện tại dể đổi lại
  body("currentPassword")
    .if(body("password").exists())
    .notEmpty().withMessage("Cần nhập mật khẩu hiện tại để đổi mật khẩu"),
];