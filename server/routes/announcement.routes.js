import express from "express";
import ManagementAnnouncement from "../models/ManagementAnnouncement.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/announcements/management
// @desc    Get active management announcements for authenticated users
// @access  Private
router.get("/management", authenticate, async (req, res) => {
  try {
    const announcements = await ManagementAnnouncement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdBy", "firstName lastName username");

    res.json({
      announcements: announcements.map((a) => ({
        _id: a._id,
        title: a.title,
        message: a.message,
        createdAt: a.createdAt,
        createdBy: a.createdBy
          ? {
              _id: a.createdBy._id,
              username: a.createdBy.username,
              firstName: a.createdBy.firstName,
              lastName: a.createdBy.lastName,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching management announcements:", error);
    res.status(500).json({
      message: "Server error fetching announcements",
      error: error.message,
    });
  }
});

// @route   POST /api/announcements/management
// @desc    Create management announcement
// @access  Private/Admin
router.post(
  "/management",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { title, message } = req.body;

      if (!title || !title.trim() || !message || !message.trim()) {
        return res
          .status(400)
          .json({ message: "Title and message are required" });
      }

      const announcement = await ManagementAnnouncement.create({
        title: title.trim(),
        message: message.trim(),
        createdBy: req.user._id,
      });

      const populated = await ManagementAnnouncement.findById(announcement._id)
        .populate("createdBy", "firstName lastName username")
        .lean();

      res.status(201).json({
        message: "Management announcement sent successfully",
        announcement: {
          _id: populated._id,
          title: populated.title,
          message: populated.message,
          createdAt: populated.createdAt,
          createdBy: populated.createdBy
            ? {
                _id: populated.createdBy._id,
                username: populated.createdBy.username,
                firstName: populated.createdBy.firstName,
                lastName: populated.createdBy.lastName,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Error creating management announcement:", error);
      res.status(500).json({
        message: "Server error creating announcement",
        error: error.message,
      });
    }
  },
);

export default router;
