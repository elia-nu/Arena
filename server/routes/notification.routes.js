import express from "express";
import Notification from "../models/Notification.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../services/notification.service.js";

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .populate("relatedEntity.entityId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await getUnreadCount(req.user._id);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching notifications",
      error: error.message,
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching unread count",
      error: error.message,
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Error marking notification as read",
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting notification",
      error: error.message,
    });
  }
});

export default router;
