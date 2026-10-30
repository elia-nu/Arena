import express from "express";
import mongoose from "mongoose";
import CommunityImpactEntry from "../models/CommunityImpactEntry.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      status = "published",
      featured,
      page = 1,
      limit = 20,
      sort = "newest",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (featured === "true") query.isFeatured = true;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortBy =
      sort === "oldest"
        ? { date: 1, createdAt: 1 }
        : { isFeatured: -1, date: -1, createdAt: -1 };

    const entries = await CommunityImpactEntry.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await CommunityImpactEntry.countDocuments(query);

    res.json({
      entries,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching community impact entries",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }

    const entry = await CommunityImpactEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Community impact entry not found" });
    }

    res.json({ entry });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching community impact entry",
      error: error.message,
    });
  }
});

router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const {
      title,
      description,
      sponsor,
      images = [],
      videos = [],
      date,
      place,
      status = "published",
      isFeatured = false,
    } = req.body;

    if (!title || !date || !place) {
      return res
        .status(400)
        .json({ message: "Title, date, and place are required" });
    }

    const entry = new CommunityImpactEntry({
      title,
      description,
      sponsor: sponsor || undefined,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      videos: Array.isArray(videos)
        ? videos
            .filter((v) => v && v.url)
            .map((v) => ({
              url: v.url,
              sourceType: v.sourceType === "upload" ? "upload" : "url",
            }))
        : [],
      date,
      place,
      status,
      isFeatured: Boolean(isFeatured),
      createdBy: req.user._id,
    });

    await entry.save();

    res.status(201).json({
      message: "Community impact entry created successfully",
      entry,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: "Server error creating community impact entry",
      error: error.message,
    });
  }
});

router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "sponsor",
      "images",
      "videos",
      "date",
      "place",
      "status",
      "isFeatured",
    ];

    const entry = await CommunityImpactEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Community impact entry not found" });
    }

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "images") {
          entry.images = Array.isArray(req.body.images)
            ? req.body.images.filter(Boolean)
            : [];
          return;
        }

        if (field === "videos") {
          entry.videos = Array.isArray(req.body.videos)
            ? req.body.videos
                .filter((v) => v && v.url)
                .map((v) => ({
                  url: v.url,
                  sourceType: v.sourceType === "upload" ? "upload" : "url",
                }))
            : [];
          return;
        }

        entry[field] = req.body[field];
      }
    });

    await entry.save();

    res.json({
      message: "Community impact entry updated successfully",
      entry,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: "Server error updating community impact entry",
      error: error.message,
    });
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry ID" });
    }

    const entry = await CommunityImpactEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Community impact entry not found" });
    }

    res.json({ message: "Community impact entry deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting community impact entry",
      error: error.message,
    });
  }
});

export default router;
