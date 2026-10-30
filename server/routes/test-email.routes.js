import express from "express";
import { sendEmail } from "../services/email.service.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   POST /api/test-email
// @desc    Test email sending (Admin only)
// @access  Private/Admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    console.log("🧪 Testing email service...");
    console.log("Environment check:", {
      EMAIL_HOST: process.env.EMAIL_HOST || "not set",
      EMAIL_PORT: process.env.EMAIL_PORT || "not set",
      EMAIL_USER: process.env.EMAIL_USER ? "***set***" : "not set",
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? "***set***" : "not set",
    });

    const result = await sendEmail(email, "userRegistration", {
      userName: "Test User",
      username: "testuser",
      email: email,
      role: "player",
    });

    if (result.success) {
      res.json({
        message: "Test email sent successfully!",
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        message: "Failed to send test email",
        error: result.message || result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error testing email",
      error: error.message,
    });
  }
});

export default router;
