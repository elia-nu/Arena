import mongoose from "mongoose";

const teamJoinRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
teamJoinRequestSchema.index({ team: 1, status: 1, createdAt: -1 });
teamJoinRequestSchema.index({ player: 1, status: 1 });
teamJoinRequestSchema.index({ team: 1, player: 1 }); // Prevent duplicate requests

// Prevent duplicate pending requests
teamJoinRequestSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "pending") {
    const existing = await mongoose
      .model("TeamJoinRequest")
      .findOne({
        team: this.team,
        player: this.player,
        status: "pending",
      });
    if (existing) {
      return next(new Error("You already have a pending request for this team"));
    }
  }
  next();
});

const TeamJoinRequest = mongoose.model("TeamJoinRequest", teamJoinRequestSchema);

export default TeamJoinRequest;

