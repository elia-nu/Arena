import mongoose from "mongoose";

const mediaThemeSchema = new mongoose.Schema(
  {
    // Stored value is used directly by Media items (e.g. "Competition")
    value: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mediaThemeSchema.index({ value: 1 }, { unique: true });

const MediaTheme = mongoose.model("MediaTheme", mediaThemeSchema);
export default MediaTheme;

