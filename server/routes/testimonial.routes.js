import express from "express";
import Testimonial from "../models/Testimonial.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/testimonials
// @desc    Get all published testimonials (public)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { status, limit } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    } else {
      // Default to published for public access
      query.status = "published";
    }

    const testimonials = await Testimonial.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit ? parseInt(limit) : 100)
      .select("-__v")
      .lean();

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      message: "Server error fetching testimonials",
      error: error.message,
    });
  }
});

// @route   GET /api/testimonials/:id
// @desc    Get single testimonial by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).select("-__v").lean();

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json(testimonial);
  } catch (error) {
    console.error("Error fetching testimonial:", error);
    res.status(500).json({
      message: "Server error fetching testimonial",
      error: error.message,
    });
  }
});

// @route   POST /api/testimonials
// @desc    Create new testimonial
// @access  Private/Admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, role, quote, rating, avatar, status, displayOrder } = req.body;

    // Validation
    if (!name || !role || !quote) {
      return res.status(400).json({
        message: "Name, role, and quote are required",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const testimonial = new Testimonial({
      name,
      role,
      quote,
      rating: rating || 5,
      avatar: avatar || "",
      status: status || "published",
      displayOrder: displayOrder || 0,
      createdBy: req.user.id,
    });

    await testimonial.save();

    res.status(201).json({
      message: "Testimonial created successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({
      message: "Server error creating testimonial",
      error: error.message,
    });
  }
});

// @route   PUT /api/testimonials/:id
// @desc    Update testimonial
// @access  Private/Admin
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, role, quote, rating, avatar, status, displayOrder } = req.body;

    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    // Update fields
    if (name !== undefined) testimonial.name = name;
    if (role !== undefined) testimonial.role = role;
    if (quote !== undefined) testimonial.quote = quote;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be between 1 and 5",
        });
      }
      testimonial.rating = rating;
    }
    if (avatar !== undefined) testimonial.avatar = avatar;
    if (status !== undefined) testimonial.status = status;
    if (displayOrder !== undefined) testimonial.displayOrder = displayOrder;

    await testimonial.save();

    res.json({
      message: "Testimonial updated successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({
      message: "Server error updating testimonial",
      error: error.message,
    });
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete testimonial
// @access  Private/Admin
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    await testimonial.deleteOne();

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      message: "Server error deleting testimonial",
      error: error.message,
    });
  }
});

// @route   GET /api/testimonials/admin/all
// @desc    Get all testimonials (including drafts) for admin
// @access  Private/Admin
router.get("/admin/all", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const testimonials = await Testimonial.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate("createdBy", "username email")
      .select("-__v")
      .lean();

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      message: "Server error fetching testimonials",
      error: error.message,
    });
  }
});

export default router;

