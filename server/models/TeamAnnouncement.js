import mongoose from "mongoose";

const teamAnnouncementSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

teamAnnouncementSchema.index({ team: 1, createdAt: -1 });

const TeamAnnouncement = mongoose.model(
  "TeamAnnouncement",
  teamAnnouncementSchema
);

export default TeamAnnouncement;


