import mongoose from "mongoose";

const nonProfitActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [4000, "Description cannot exceed 4000 characters"],
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    mediaUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    // Sponsor info for past activities
    sponsor: {
      name: { type: String, trim: true },
      logo: { type: String, trim: true },
      url: { type: String, trim: true },
    },
    // Multi-media for past activities: images gallery
    images: [{ type: String, trim: true }],
    // Video URLs (YouTube, Vimeo, etc.)
    videos: [{ type: String, trim: true }],
    date: {
      type: Date,
      required: [true, "Date and time are required"],
    },
    venue: {
      type: String,
      trim: true,
      required: [true, "Venue is required"],
    },
    maxParticipants: {
      type: Number,
      min: [1, "Maximum participants must be at least 1"],
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper virtuals
nonProfitActivitySchema.virtual("participantCount").get(function () {
  return this.participants?.length || 0;
});

nonProfitActivitySchema.index({ date: 1, status: 1 });
nonProfitActivitySchema.index({ isFeatured: 1, status: 1 });

// At least one of: mediaUrl, images, or videos must be present
nonProfitActivitySchema.pre("save", function (next) {
  const hasMedia =
    this.mediaUrl ||
    (this.images && this.images.length > 0) ||
    (this.videos && this.videos.length > 0);
  if (!hasMedia) {
    next(new Error("At least one of mediaUrl, images, or videos is required"));
  } else {
    next();
  }
});

const NonProfitActivity = mongoose.model(
  "NonProfitActivity",
  nonProfitActivitySchema
);

export default NonProfitActivity;


