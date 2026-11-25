import { Router } from "express";
import { register, login, getMe, updateMe } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  registerRules,
  loginRules,
  updateMeRules,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", auth, getMe);
router.put("/me", auth, updateMeRules, validate, updateMe);

export default router;