import { Router } from "express";
import { getDoctors, createDoctor, getDoctorSlots } from "../controllers/doctor.controller";
import { authenticate, adminOnly } from "../middlewares/auth";
import { asyncHandler } from "../utils/http";

const router = Router();
router.get("/", asyncHandler(getDoctors));
router.get("/:id/slots", asyncHandler(getDoctorSlots));
router.post("/", authenticate, adminOnly, asyncHandler(createDoctor));

export default router;
