import mongoose from "mongoose";

const mediaCategorySchema = new mongoose.Schema(
  {
    // Stored value is the category key used by Media items (e.g. "behind-the-scenes")
    value: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mediaCategorySchema.index({ value: 1 }, { unique: true });

const MediaCategory = mongoose.model(
  "MediaCategory",
  mediaCategorySchema
);
export default MediaCategory;

