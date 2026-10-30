import mongoose from "mongoose";

const managementAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

managementAnnouncementSchema.index({ isActive: 1, createdAt: -1 });

const ManagementAnnouncement = mongoose.model(
  "ManagementAnnouncement",
  managementAnnouncementSchema,
);

export default ManagementAnnouncement;
