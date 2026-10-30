import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    matchNumber: {
      type: Number,
    },
    round: {
      type: String,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTime: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    team1: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: {
        type: Number,
        default: 0,
        min: [0, "Score cannot be negative"],
      },
    },
    team2: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: {
        type: Number,
        default: 0,
        min: [0, "Score cannot be negative"],
      },
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled", "postponed"],
      default: "scheduled",
    },
    result: {
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "result.winnerType",
      },
      winnerType: {
        type: String,
        enum: ["Team", "User"],
      },
      score: {
        team1Score: Number,
        team2Score: Number,
      },
      completedAt: Date,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    image: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
matchSchema.index({ tournament: 1, scheduledDate: 1 });
matchSchema.index({ status: 1, scheduledDate: 1 });
matchSchema.index({ isPromoted: 1, scheduledDate: 1 });

// Virtual for checking if match is upcoming
matchSchema.virtual("isUpcoming").get(function () {
  const now = new Date();
  return this.status === "scheduled" && new Date(this.scheduledDate) > now;
});

// Method to update match result
matchSchema.methods.setResult = function (team1Score, team2Score) {
  this.result = {
    score: {
      team1Score,
      team2Score,
    },
    completedAt: new Date(),
  };

  if (team1Score > team2Score) {
    this.result.winner = this.team1.team || this.team1.player;
    this.result.winnerType = this.team1.team ? "Team" : "User";
  } else if (team2Score > team1Score) {
    this.result.winner = this.team2.team || this.team2.player;
    this.result.winnerType = this.team2.team ? "Team" : "User";
  }

  this.status = "completed";
  this.team1.score = team1Score;
  this.team2.score = team2Score;
};

const Match = mongoose.model("Match", matchSchema);

export default Match;
