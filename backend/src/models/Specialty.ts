import { Schema, model } from "mongoose";

const specialtySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

// Unique không phân biệt hoa thường: "Nội khoa" và "nội khoa" bị coi là trùng
specialtySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "vi", strength: 2 } }
);

export default model("Specialty", specialtySchema);