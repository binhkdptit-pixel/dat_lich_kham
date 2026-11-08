import { Request, Response } from "express";
import Doctor from "../models/Doctor";

export const getDoctors = async (_req: Request, res: Response) => {
  const doctors = await Doctor.find();
  res.json(doctors);
};

export const createDoctor = async (req: Request, res: Response) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json(doctor);
};
