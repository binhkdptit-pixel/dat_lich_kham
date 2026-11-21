import { Router } from "express";
import {
  getAppointments,
  createAppointment,
  updateStatus,
} from "../controllers/appointment.controller";

const router = Router();
router.get("/", getAppointments);
router.post("/", createAppointment);
router.patch("/:id/status", updateStatus);

export default router;
