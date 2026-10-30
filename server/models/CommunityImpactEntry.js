import mongoose from "mongoose";

const communityImpactEntrySchema = new mongoose.Schema(
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
    sponsor: {
      name: { type: String, trim: true },
      logo: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    images: [{ type: String, trim: true }],
    videos: [
      {
        url: { type: String, trim: true },
        sourceType: {
          type: String,
          enum: ["url", "upload"],
          default: "url",
        },
      },
    ],
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    place: {
      type: String,
      trim: true,
      required: [true, "Place is required"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
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

communityImpactEntrySchema.index({ date: -1, status: 1 });
communityImpactEntrySchema.index({ isFeatured: 1, status: 1, createdAt: -1 });

communityImpactEntrySchema.pre("save", function (next) {
  const hasImage = Array.isArray(this.images) && this.images.length > 0;
  const hasVideo = Array.isArray(this.videos) && this.videos.length > 0;

  if (!hasImage && !hasVideo) {
    next(new Error("At least one image or video is required"));
    return;
  }

  next();
});

const CommunityImpactEntry = mongoose.model(
  "CommunityImpactEntry",
  communityImpactEntrySchema
);

export default CommunityImpactEntry;
