import express from "express";
import { sendEmail } from "../services/email.service.js";
import Contact from "../models/Contact.js";
import Settings from "../models/Settings.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    // Get admin email from environment or use default
    const adminEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_USER || "info@example.com";

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
            .message-box { margin-top: 20px; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="message-box">
                <div class="label">Message:</div>
                <div style="margin-top: 10px; white-space: pre-wrap;">${message}</div>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                <p>This message was sent from the contact form on your website.</p>
                <p>You can reply directly to: <a href="mailto:${email}">${email}</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Save contact message to database
    const contactMessage = new Contact({
      name,
      email,
      subject,
      message,
      status: "new",
    });

    await contactMessage.save();

    // Send email to admin
    const emailResult = await sendEmail(
      adminEmail,
      "contactForm",
      {
        name,
        email,
        subject,
        message,
        html: emailHtml,
      }
    );

    // If email service is not configured, we'll still return success
    // but log a warning
    if (!emailResult.success) {
      console.warn("⚠️ Contact form submitted but email not sent:", emailResult.message);
      // Still return success to user, but log the issue
    }

    // Optionally send auto-reply to user
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .message { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Thank You for Contacting Us!</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <div class="message">
                <p>Thank you for reaching out to us. We have received your message regarding:</p>
                <p><strong>${subject}</strong></p>
                <p>Our team will review your inquiry and get back to you within 24 hours.</p>
              </div>
              <p>Best regards,<br>The Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Try to send auto-reply (non-blocking)
    sendEmail(email, "contactFormReply", {
      name,
      subject,
      html: autoReplyHtml,
    }).catch((err) => {
      console.warn("Failed to send auto-reply:", err.message);
      // Don't fail the request if auto-reply fails
    });

    res.json({
      message: "Thank you for your message! We'll get back to you soon.",
      success: true,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({
      message: "An error occurred while processing your request. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/contact/info
// @desc    Get public contact information
// @access  Public
router.get("/info", async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: "contact" });
    
    if (!settings || !settings.data) {
      // Return default values if no settings exist
      const defaultContactInfo = {
        email: process.env.CONTACT_EMAIL || "",
        phone: process.env.CONTACT_PHONE || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        website: "",
        socialPageEnabled: true,
        shopPageEnabled: true,
        socialMedia: {
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: "",
          tiktok: "",
          youtube: "",
        },
      };
      return res.json({ contactInfo: defaultContactInfo });
    }

    res.json({ contactInfo: settings.data });
  } catch (error) {
    console.error("Error fetching contact info:", error);
    res.status(500).json({
      message: "Server error fetching contact info",
      error: error.message,
    });
  }
});

export default router;

