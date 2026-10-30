import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    platform: {
      type: String,
      enum: ["youtube", "tiktok", "direct", null],
      default: null,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: "other",
      trim: true,
    },
    event: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    theme: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    duration: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
mediaSchema.index({ category: 1, visibility: 1 });
mediaSchema.index({ theme: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ featured: 1, sortOrder: 1 });

// Virtual for timestamp formatting
mediaSchema.virtual("formattedTimestamp").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return "Just now";
  if (hours < 2) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return this.createdAt.toLocaleDateString();
});

const Media = mongoose.model("Media", mediaSchema);

export default Media;

