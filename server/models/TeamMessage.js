import mongoose from "mongoose";

const teamMessageSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

teamMessageSchema.index({ team: 1, createdAt: -1 });

const TeamMessage = mongoose.model("TeamMessage", teamMessageSchema);

export default TeamMessage;


