import { Router } from "express";
import { getStats } from "../controllers/stats.controller";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";

const router = Router();
router.get("/", auth, authorize("admin"), getStats);

export default router;
