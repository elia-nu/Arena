import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [100, "Tournament name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    location: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    format: {
      type: String,
      enum: ["knockout", "round-robin", "group-stage", "mixed"],
      default: "knockout",
    },
    tournamentType: {
      type: String,
      enum: ["team", "individual", "both"],
      default: "both",
      required: [true, "Tournament type is required"],
    },
    maxTeams: {
      type: Number,
      required: [true, "Maximum teams is required"],
      min: [2, "Tournament must allow at least 2 teams"],
    },
    minTeams: {
      type: Number,
      default: 2,
      min: [2, "Minimum teams must be at least 2"],
    },
    minTeamMembers: {
      type: Number,
      default: 2,
      min: [1, "Minimum team members must be at least 1"],
    },
    maxTeamMembers: {
      type: Number,
      default: 10,
      min: [2, "Maximum team members must be at least 2"],
    },
    entryFee: {
      type: Number,
      default: 0,
      min: [0, "Entry fee cannot be negative"],
    },
    prizePool: {
      type: Number,
      default: 0,
      min: [0, "Prize pool cannot be negative"],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "registration_closed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
    promotedAt: {
      type: Date,
    },
    image: {
      type: String,
    },
    rules: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredTeams: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "paid", "refunded"],
          default: "pending",
        },
        paymentMethod: {
          type: String,
          enum: ["stripe", "apple_pay", "zelle", "cash_app", "other"],
        },
        paymentIntentId: {
          type: String,
        },
        zellePayment: {
          sendersName: {
            type: String,
          },
          email: {
            type: String,
          },
          amount: {
            type: Number,
          },
          transactionReference: {
            type: String,
          },
          verificationNotes: {
            type: String,
          },
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          verifiedAt: {
            type: Date,
          },
        },
      },
    ],
    registeredPlayers: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "paid", "refunded"],
          default: "pending",
        },
        paymentMethod: {
          type: String,
          enum: ["stripe", "apple_pay", "zelle", "cash_app", "other"],
        },
        paymentIntentId: {
          type: String,
        },
        zellePayment: {
          sendersName: {
            type: String,
          },
          email: {
            type: String,
          },
          amount: {
            type: Number,
          },
          transactionReference: {
            type: String,
          },
          verificationNotes: {
            type: String,
          },
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          verifiedAt: {
            type: Date,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
tournamentSchema.index({ startDate: 1, status: 1 });
tournamentSchema.index({ status: 1, isPromoted: 1 });

// Virtual for checking if registration is open
tournamentSchema.virtual("isRegistrationOpen").get(function () {
  const now = new Date();
  return (
    this.status === "open" &&
    now < this.registrationDeadline &&
    this.registeredTeams.length + this.registeredPlayers.length < this.maxTeams
  );
});

// Method to check if tournament is full
tournamentSchema.methods.isFull = function () {
  const totalRegistrations =
    this.registeredTeams.length + this.registeredPlayers.length;
  return totalRegistrations >= this.maxTeams;
};

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;
