import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { asyncHandler } from "../utils/http";
import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from "../controllers/schedule.controller";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(getSchedules));
router.post("/", asyncHandler(createSchedule));
router.put("/:id", asyncHandler(updateSchedule));
router.delete("/:id", asyncHandler(deleteSchedule));
export default router;
