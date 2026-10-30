import express from "express";
import mongoose from "mongoose";
import NonProfitActivity from "../models/NonProfitActivity.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/nonprofit
// @desc    List non-profit activities (public, with filters)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { status = "published", upcoming, featured, page = 1, limit = 20 } =
      req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.date = { $gte: new Date() };
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await NonProfitActivity.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NonProfitActivity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching non-profit activities",
      error: error.message,
    });
  }
});

// @route   GET /api/nonprofit/mine
// @desc    Get activities current user has joined
// @access  Private
router.get("/mine", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const activities = await NonProfitActivity.find({
      "participants.user": userId,
    })
      .sort({ date: 1 })
      .lean();

    res.json({ activities });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching your non-profit activities",
      error: error.message,
    });
  }
});

// @route   GET /api/nonprofit/:id
// @desc    Get single activity
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }

    const activity = await NonProfitActivity.findById(req.params.id).populate(
      "participants.user",
      "username firstName lastName phone"
    );

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json({ activity });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching activity",
      error: error.message,
    });
  }
});

// @route   POST /api/nonprofit
// @desc    Create activity (admin)
// @access  Private/Admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    let {
      title,
      description,
      type,
      mediaUrl,
      thumbnailUrl,
      date,
      venue,
      sponsor,
      images,
      videos,
    } = req.body;

    // If image and we only have a thumbnail URL (from upload), use it as mediaUrl
    if (type === "image" && !mediaUrl && thumbnailUrl) {
      mediaUrl = thumbnailUrl;
    }
    // If images array has items, use first as mediaUrl for backward compat
    if (!mediaUrl && images && images.length > 0) {
      mediaUrl = images[0];
    }
    // If videos array has items and no other media, use first video as mediaUrl
    if (!mediaUrl && videos && videos.length > 0) {
      mediaUrl = videos[0];
      type = type || "video";
    }

    const hasMedia =
      mediaUrl ||
      (images && images.length > 0) ||
      (videos && videos.length > 0);
    if (!title || !date || !venue || !hasMedia) {
      return res.status(400).json({
        message:
          "Title, date/time, venue, and at least one media (mediaUrl, images, or videos) are required",
      });
    }

    const activity = new NonProfitActivity({
      title,
      description,
      type: type || "image",
      mediaUrl: mediaUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      sponsor: sponsor || undefined,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      videos: Array.isArray(videos) ? videos.filter(Boolean) : [],
      date,
      venue,
      createdBy: req.user._id,
      status: "published",
    });

    await activity.save();

    res.status(201).json({
      message: "Non-profit activity created successfully",
      activity,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error creating activity",
      error: error.message,
    });
  }
});

// @route   PUT /api/nonprofit/:id
// @desc    Update activity (admin)
// @access  Private/Admin
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "type",
      "mediaUrl",
      "thumbnailUrl",
      "date",
      "venue",
      "maxParticipants",
      "status",
      "isFeatured",
      "sponsor",
      "images",
      "videos",
    ];

    const activity = await NonProfitActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "images" || field === "videos") {
          activity[field] = Array.isArray(req.body[field])
            ? req.body[field].filter(Boolean)
            : [];
        } else {
          activity[field] = req.body[field];
        }
      }
    });

    await activity.save();

    res.json({
      message: "Non-profit activity updated successfully",
      activity,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error updating activity",
      error: error.message,
    });
  }
});

// @route   DELETE /api/nonprofit/:id
// @desc    Delete activity (admin)
// @access  Private/Admin
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }

    const activity = await NonProfitActivity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json({ message: "Non-profit activity deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting activity",
      error: error.message,
    });
  }
});

// @route   POST /api/nonprofit/:id/join
// @desc    Join an activity (authenticated user)
// @access  Private
router.post("/:id/join", authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid activity ID" });
    }

    const activity = await NonProfitActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    if (activity.status !== "published") {
      return res
        .status(400)
        .json({ message: "This activity is not open for joining" });
    }

    if (activity.date < new Date()) {
      return res
        .status(400)
        .json({ message: "This activity has already occurred" });
    }

    const alreadyJoined = activity.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res
        .status(400)
        .json({ message: "You have already joined this activity" });
    }

    if (
      activity.maxParticipants &&
      activity.participants.length >= activity.maxParticipants
    ) {
      return res
        .status(400)
        .json({ message: "This activity is already full" });
    }

    activity.participants.push({
      user: req.user._id,
      joinedAt: new Date(),
    });

    await activity.save();

    res.json({
      message: "You have successfully joined this activity",
      activity,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error joining activity",
      error: error.message,
    });
  }
});

export default router;


