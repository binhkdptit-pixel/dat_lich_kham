import { Router } from "express";
import { body, param, query } from "express-validator";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller";

const router = Router();

const idRule = param("id").isMongoId().withMessage("ID không hợp lệ");

const createRules = [
  body("name").trim().notEmpty().withMessage("Tên bác sĩ không được để trống"),
  body("email").trim().isEmail().withMessage("Email không hợp lệ").toLowerCase(),
  body("password").isLength({ min: 6 }).withMessage("Mật khẩu tối thiểu 6 ký tự"),
  body("phone").optional().trim(),
  body("specialty").isMongoId().withMessage("Chuyên khoa không hợp lệ"),
  body("experience")
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage("Số năm kinh nghiệm từ 0 đến 60")
    .toInt(),
  body("description").optional().trim().isLength({ max: 2000 }).withMessage("Mô tả tối đa 2000 ký tự"),
];

const updateRules = [
  body("name").optional().trim().notEmpty().withMessage("Tên bác sĩ không được để trống"),
  body("phone").optional().trim(),
  body("specialty").optional().isMongoId().withMessage("Chuyên khoa không hợp lệ"),
  body("experience")
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage("Số năm kinh nghiệm từ 0 đến 60")
    .toInt(),
  body("description").optional().trim().isLength({ max: 2000 }).withMessage("Mô tả tối đa 2000 ký tự"),
];

router.get(
  "/",
  query("specialty").optional().isMongoId().withMessage("Mã chuyên khoa không hợp lệ"),
  validate,
  getDoctors
);
router.get("/:id", idRule, validate, getDoctorById);
router.post("/", auth, authorize("admin"), createRules, validate, createDoctor);
router.put("/:id", auth, authorize("admin"), idRule, updateRules, validate, updateDoctor);
router.delete("/:id", auth, authorize("admin"), idRule, validate, deleteDoctor);

export default router;