import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["payment", "branding", "contact", "general"],
      unique: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Note: type field already has unique: true which creates an index automatically

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
