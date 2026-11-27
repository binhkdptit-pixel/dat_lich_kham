import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import {
  listUsersRules,
  createUserRules,
  updateUserRules,
  idParamRules,
} from "../validators/user.validator";

const router = Router();

// Toàn bộ API quản lý người dùng chỉ dành cho admin
router.use(auth, authorize("admin"));

router.get("/", listUsersRules, validate, getUsers);
router.post("/", createUserRules, validate, createUser);
router.put("/:id", updateUserRules, validate, updateUser);
router.delete("/:id", idParamRules, validate, deleteUser);

export default router;