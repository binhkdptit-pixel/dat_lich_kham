import { Router } from "express";
import { body, param } from "express-validator";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from "../controllers/specialty.controller";

const router = Router();

const idRule = param("id").isMongoId().withMessage("ID không hợp lệ");

// Khi sửa (PUT) thì name là tuỳ chọn, khi thêm (POST) thì bắt buộc
const specialtyFields = (isUpdate: boolean) => [
  (isUpdate ? body("name").optional() : body("name"))
    .trim()
    .notEmpty().withMessage("Tên chuyên khoa không được để trống")
    .isLength({ max: 100 }).withMessage("Tên tối đa 100 ký tự"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Mô tả tối đa 1000 ký tự"),
];

router.get("/", getSpecialties);
router.post("/", auth, authorize("admin"), specialtyFields(false), validate, createSpecialty);
router.put("/:id", auth, authorize("admin"), idRule, specialtyFields(true), validate, updateSpecialty);
router.delete("/:id", auth, authorize("admin"), idRule, validate, deleteSpecialty);

export default router;