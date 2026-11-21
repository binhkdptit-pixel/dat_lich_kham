import { Router } from "express";
import { getAppointments, getDoctorAppointments, createAppointment, updateStatus } from "../controllers/appointment.controller";
import { authenticate, adminOnly, doctorOnly } from "../middlewares/auth";
import { asyncHandler } from "../utils/http";

const router = Router();
router.get("/doctor", authenticate, doctorOnly, asyncHandler(getDoctorAppointments));
router.get("/", authenticate, adminOnly, asyncHandler(getAppointments));
router.post("/", asyncHandler(createAppointment));
router.patch("/:id/status", authenticate, asyncHandler(updateStatus));
export default router;
