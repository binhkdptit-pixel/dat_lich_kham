import { isObjectIdOrHexString } from "mongoose";
import { HttpError } from "./http";

export function objectId(value: unknown, label = "ID"): string {
  if (typeof value !== "string" || !isObjectIdOrHexString(value)) {
    throw new HttpError(400, `${label} không hợp lệ`);
  }
  return value.toLowerCase();
}

export function requiredText(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new HttpError(400, `${label} bắt buộc và không quá ${max} ký tự`);
  }
  return value.trim();
}

export function optionalText(value: unknown, label: string, max = 2000): string | undefined {
  return value === undefined ? undefined : requiredText(value, label, max);
}
