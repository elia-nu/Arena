/* eslint-env node */
import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Team from "../models/Team.js";
import EmailVerification from "../models/EmailVerification.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { sendEmail } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";
import { generateUniqueUsername } from "../utils/username.js";

const router = express.Router();

const defaultPhoneRegion = process.env.DEFAULT_PHONE_REGION || "US";
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
// Match pendingRegistration localStorage window (24h) so Stripe return still works
const EMAIL_VERIFICATION_TOKEN_EXPIRES = "24h";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
  String(crypto.randomInt(100000, 1000000));

const createEmailVerificationToken = (email) =>
  jwt.sign(
    { email, purpose: "registration_email" },
    process.env.JWT_SECRET,
    { expiresIn: EMAIL_VERIFICATION_TOKEN_EXPIRES },
  );

const verifyEmailVerificationToken = (token, expectedEmail) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== "registration_email") {
      return { valid: false, message: "Invalid email verification token" };
    }
    if (
      !expectedEmail ||
      payload.email?.toLowerCase() !== expectedEmail.toLowerCase()
    ) {
      return {
        valid: false,
        message: "Email verification does not match this registration",
      };
    }
    return { valid: true, email: payload.email };
  } catch {
    return {
      valid: false,
      message: "Email verification expired. Please verify your email again.",
    };
  }
};

// Helper to build frontend URL for links
const getFrontendBaseUrl = () => {
  return (
    process.env.SMS_FRONTEND_URL ||
    "https://www.leskickit.com" ||
    "http://localhost:5173"
  );
};

const isDuplicateEmailKeyError = (error) =>
  error?.code === 11000 && Boolean(error?.keyPattern?.email);

const repairEmailSparseUniqueIndexIfNeeded = async () => {
  const indexes = await User.collection.indexes();
  const emailIndex = indexes.find((idx) => idx.key && idx.key.email === 1);
  if (!emailIndex) return false;

  // If the index is already sparse/partial, no repair is needed.
  const isAlreadySafe = emailIndex.sparse || emailIndex.partialFilterExpression;
  if (isAlreadySafe) return false;

  const indexName = emailIndex.name || "email_1";
  await User.collection.dropIndex(indexName);
  await User.collection.createIndex(
    { email: 1 },
    {
      unique: true,
      sparse: true,
      name: "email_1",
      background: true,
    },
  );
  return true;
};

// @route   POST /api/auth/send-registration-otp
// @desc    Send a 6-digit OTP to verify email before registration
// @access  Public
router.post("/send-registration-otp", async (req, res) => {
  try {
    const rawEmail =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!rawEmail || !validateEmail(rawEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const existingUser = await User.findOne({ email: rawEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    const existing = await EmailVerification.findOne({ email: rawEmail });
    if (existing?.lastSentAt) {
      const secondsSinceLastSend =
        (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend,
        );
        return res.status(429).json({
          message: `Please wait ${retryAfter}s before requesting another code`,
          retryAfter,
        });
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Persist OTP first, but only set lastSentAt after a successful send
    // so SMTP failures do not trigger the resend cooldown.
    await EmailVerification.findOneAndUpdate(
      { email: rawEmail },
      {
        email: rawEmail,
        otpHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const emailResult = await sendEmail(rawEmail, "registrationOtp", {
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    if (!emailResult.success) {
      return res.status(503).json({
        message:
          emailResult.message ||
          "Unable to send verification email. Please try again later.",
      });
    }

    await EmailVerification.updateOne(
      { email: rawEmail },
      { lastSentAt: new Date() },
    );

    return res.json({
      message: "Verification code sent to your email",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    return res.status(500).json({
      message: "Server error while sending verification code",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/verify-registration-otp
// @desc    Verify email OTP and return a short-lived registration token
// @access  Public
router.post("/verify-registration-otp", async (req, res) => {
  try {
    const rawEmail =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const otp =
      typeof req.body.otp === "string"
        ? req.body.otp.trim()
        : String(req.body.otp || "").trim();

    if (!rawEmail || !validateEmail(rawEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Please enter the 6-digit verification code" });
    }

    const record = await EmailVerification.findOne({ email: rawEmail });
    if (!record) {
      return res.status(400).json({
        message: "No verification code found. Please request a new one.",
      });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await EmailVerification.deleteOne({ _id: record._id });
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
      });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await EmailVerification.deleteOne({ _id: record._id });
      return res.status(400).json({
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    if (record.otpHash !== hashOtp(otp)) {
      record.attempts += 1;
      await record.save();
      const remaining = OTP_MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        message:
          remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    record.verified = true;
    await record.save();

    const emailVerificationToken = createEmailVerificationToken(rawEmail);

    // Clean up used OTP record
    await EmailVerification.deleteOne({ _id: record._id });

    return res.json({
      message: "Email verified successfully",
      email: rawEmail,
      emailVerificationToken,
    });
  } catch (error) {
    console.error("Error verifying registration OTP:", error);
    return res.status(500).json({
      message: "Server error while verifying code",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/check-availability
// @desc    Check if email/phone/team name is available before registration
// @access  Public
router.post("/check-availability", async (req, res) => {
  try {
    const { email, phone, teamName, teamMembers } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone =
      typeof phone === "string"
        ? normalizePhoneNumber(phone, defaultPhoneRegion)
        : "";
    const normalizedTeamName =
      typeof teamName === "string" ? teamName.trim() : "";

    const errors = {};

    // Check individual email/phone
    if (normalizedEmail || normalizedPhone) {
      const existingUser = await User.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      });

      if (existingUser) {
        if (
          normalizedEmail &&
          existingUser.email?.toLowerCase() === normalizedEmail
        ) {
          errors.email = "Email already exists";
        }
        if (normalizedPhone && existingUser.phone === normalizedPhone) {
          errors.phone = "Phone already exists";
        }
      }
    }

    // Check team name
    if (normalizedTeamName) {
      const existingTeam = await Team.findOne({
        name: { $regex: new RegExp(`^${normalizedTeamName}$`, "i") },
      });
      if (existingTeam) {
        errors.teamName = "Team name already exists";
      }
    }

    // Check team members
    if (teamMembers && Array.isArray(teamMembers)) {
      const allEmails = teamMembers
        .map((m) => (m.email?.trim() ? m.email.trim().toLowerCase() : null))
        .filter(Boolean);
      const phonesSeen = new Map();
      const allNormalizedPhones = [];

      teamMembers.forEach((m, idx) => {
        const normalized = normalizePhoneNumber(
          m.phone?.trim?.() || "",
          defaultPhoneRegion,
        );
        if (normalized) {
          if (phonesSeen.has(normalized)) {
            errors[`member_${idx}_phone`] =
              "Duplicate phone number in this team";
          }
          phonesSeen.set(normalized, idx);
          allNormalizedPhones.push(normalized);
        }
      });

      const orConditions = [];
      if (allEmails.length > 0) {
        orConditions.push({ email: { $in: allEmails } });
      }
      if (allNormalizedPhones.length > 0) {
        orConditions.push({ phone: { $in: allNormalizedPhones } });
      }

      if (orConditions.length > 0) {
        const existingUsers = await User.find({ $or: orConditions });

        existingUsers.forEach((user) => {
          if (user.email) {
            const memberIndex = teamMembers.findIndex(
              (m) => m.email?.toLowerCase() === user.email.toLowerCase(),
            );
            if (memberIndex !== -1) {
              errors[`member_${memberIndex}_email`] = "Email already exists";
            }
          }

          if (user.phone) {
            const memberIndex = teamMembers.findIndex((m) => {
              const p = normalizePhoneNumber(
                m.phone?.trim?.() || "",
                defaultPhoneRegion,
              );
              return p === user.phone;
            });
            if (memberIndex !== -1) {
              errors[`member_${memberIndex}_phone`] =
                "Phone already registered";
            }
          }
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        available: false,
        errors,
      });
    }

    res.json({ available: true });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      message: "Server error checking availability",
      error: error.message,
    });
  }
});

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

const parseDob = (dob) => {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const validateDob = (dob) => {
  const parsed = parseDob(dob);
  if (!parsed) {
    return { valid: false, message: "Please provide a valid date of birth" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  if (parsed >= today) {
    return { valid: false, message: "Date of birth must be in the past" };
  }

  return { valid: true, date: parsed };
};

const validateTeamMembers = (members) => {
  if (!Array.isArray(members) || members.length < 2) {
    return { valid: false, message: "Team must have at least 2 members" };
  }

  if (members.length > 10) {
    return { valid: false, message: "Team cannot have more than 10 members" };
  }

  const emails = new Set();
  const phones = new Set();

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    if (!member.firstName || !member.lastName) {
      return {
        valid: false,
        message: `Member ${i + 1} is missing required fields`,
      };
    }

    const dobValidation = validateDob(member.dob);
    if (!dobValidation.valid) {
      return {
        valid: false,
        message: `Member ${i + 1}: ${dobValidation.message}`,
      };
    }

    const normalizedPhone = normalizePhoneNumber(
      String(member.phone || "").trim(),
      defaultPhoneRegion,
    );
    if (!normalizedPhone) {
      return {
        valid: false,
        message: `Member ${i + 1}: enter a valid phone number with country code`,
      };
    }

    const emailTrim = member.email?.trim();
    if (emailTrim && !validateEmail(emailTrim)) {
      return {
        valid: false,
        message: `Member ${i + 1} has an invalid email address`,
      };
    }

    // Only enforce password requirement for the first member (team leader).
    if (i === 0) {
      if (!member.password || String(member.password).length < 6) {
        return {
          valid: false,
          message: `Team leader password must be at least 6 characters`,
        };
      }
      if (!emailTrim || !validateEmail(emailTrim)) {
        return {
          valid: false,
          message: "Team leader email is required",
        };
      }
    }

    if (phones.has(normalizedPhone)) {
      return {
        valid: false,
        message: "Duplicate phone numbers in team members",
      };
    }

    if (emailTrim && emails.has(emailTrim.toLowerCase())) {
      return {
        valid: false,
        message: "Duplicate email addresses in team members",
      };
    }

    phones.add(normalizedPhone);
    if (emailTrim) emails.add(emailTrim.toLowerCase());
  }

  return { valid: true };
};

// @route   POST /api/auth/register
// @desc    Register a new user (individual or team)
// @access  Public
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Registration request received:", {
      registrationType: req.body.registrationType,
      hasPaymentSessionId: !!req.body.paymentSessionId,
      registrationFee: req.body.registrationFee,
      email: req.body.email || req.body.teamMembers?.[0]?.email,
    });

    const {
      registrationType,
      email,
      phone,
      password,
      firstName,
      lastName,
      dob,
      guardianName,
      guardianPhone,
      parentalConsent,
      role,
      teamName,
      teamMembers,
      registrationFee = 0, // Optional registration fee
      paymentSessionId, // If payment was completed
      emailVerificationToken,
    } = req.body;

    // Validate registration type
    if (
      !registrationType ||
      !["individual", "team"].includes(registrationType)
    ) {
      return res.status(400).json({
        message: 'Registration type must be either "individual" or "team"',
      });
    }

    // Individual registration validation
    if (registrationType === "individual") {
      const normalizedEmail = email?.trim()
        ? email.trim().toLowerCase()
        : undefined;
      const normalizedPhone = normalizePhoneNumber(
        String(phone || "").trim(),
        defaultPhoneRegion,
      );

      if (!password) {
        return res.status(400).json({
          message: "Please provide a password",
        });
      }

      if (!normalizedEmail) {
        return res.status(400).json({
          message: "Please provide a verified email address",
        });
      }

      if (!validateEmail(normalizedEmail)) {
        return res.status(400).json({
          message: "Please provide a valid email address",
        });
      }

      const emailTokenCheck = verifyEmailVerificationToken(
        emailVerificationToken,
        normalizedEmail,
      );
      if (!emailTokenCheck.valid) {
        return res.status(400).json({ message: emailTokenCheck.message });
      }

      if (!normalizedPhone) {
        return res.status(400).json({
          message: "Please provide a valid phone number",
        });
      }

      const dobValidation = validateDob(dob);
      if (!dobValidation.valid) {
        return res.status(400).json({ message: dobValidation.message });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User with this email or phone already exists",
        });
      }

      // Validate role if provided
      const userRole =
        role && ["player", "team_leader"].includes(role) ? role : "player";

      // If registration fee is required and no payment session, create payment session
      if (registrationFee > 0 && !paymentSessionId) {
        try {
          const { createRegistrationCheckoutSession } =
            await import("../services/stripe.service.js");
          const paymentResult = await createRegistrationCheckoutSession({
            amount: registrationFee,
            currency: "usd",
            email: normalizedEmail,
            registrationType: "individual",
            metadata: {
              email: normalizedEmail,
              registrationType: "individual",
              role: userRole,
            },
          });

          if (paymentResult.success) {
            return res.json({
              requiresPayment: true,
              checkoutUrl: paymentResult.checkoutUrl,
              sessionId: paymentResult.sessionId,
              message: "Please complete payment to finish registration",
            });
          }
        } catch (paymentError) {
          console.error("Error creating payment session:", paymentError);
          // Continue with registration if payment setup fails
        }
      }

      // If payment session provided, verify payment
      if (paymentSessionId && registrationFee > 0) {
        try {
          console.log("💳 Verifying payment session:", paymentSessionId);
          const { verifyPaymentSession } =
            await import("../services/stripe.service.js");
          const paymentVerification =
            await verifyPaymentSession(paymentSessionId);
          console.log("💳 Payment verification result:", {
            success: paymentVerification.success,
            paymentStatus: paymentVerification.paymentStatus,
          });

          if (
            !paymentVerification.success ||
            paymentVerification.paymentStatus !== "paid"
          ) {
            console.error("❌ Payment verification failed");
            return res.status(400).json({
              message:
                "Payment not completed. Please complete payment to register.",
            });
          }
          console.log("✅ Payment verified successfully");
        } catch (paymentError) {
          console.error("❌ Error verifying payment:", paymentError);
          return res.status(400).json({
            message: "Payment verification failed. Please try again.",
          });
        }
      }

      // Create new user
      const generatedUsername = await generateUniqueUsername(User, {
        email: normalizedEmail,
        phone: normalizedPhone,
        firstName,
        lastName,
      });
      const isMinor = dobValidation.date
        ? (() => {
            const birthDate = new Date(dobValidation.date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            return age < 18;
          })()
        : false;

      if (isMinor && (!guardianName || !guardianPhone || !parentalConsent)) {
        return res.status(400).json({
          message:
            "Parent or guardian name, emergency phone, and consent are required for participants under 18.",
        });
      }

      console.log("👤 Creating user:", { email, role: userRole });
      const user = new User({
        username: generatedUsername,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        password,
        firstName,
        lastName,
        dob: dobValidation.date,
        guardianName: isMinor ? guardianName : undefined,
        guardianPhone: isMinor ? guardianPhone : undefined,
        parentalConsent: isMinor ? Boolean(parentalConsent) : false,
        isMinor,
        role: userRole,
      });

      try {
        await user.save();
      } catch (saveError) {
        // Some hosted DBs still have an old non-sparse unique email index.
        // With empty email, Mongo can incorrectly conflict on null values.
        if (isDuplicateEmailKeyError(saveError) && !normalizedEmail) {
          try {
            const repaired = await repairEmailSparseUniqueIndexIfNeeded();
            if (repaired) {
              await user.save();
            } else {
              throw saveError;
            }
          } catch (repairError) {
            throw repairError;
          }
        } else {
          throw saveError;
        }
      }
      console.log("✅ User created successfully:", user._id);

      // Send registration and payment success email if payment was made
      if (paymentSessionId && registrationFee > 0 && normalizedEmail) {
        try {
          console.log(
            "Attempting to send registration & payment success email to:",
            normalizedEmail,
          );
          const emailResult = await sendEmail(
            normalizedEmail,
            "registrationPaymentSuccess",
            {
              userName: firstName || generatedUsername,
              firstName,
              email: normalizedEmail,
              role: userRole,
              memberCode: user.memberCode,
              amount: registrationFee,
              transactionId: paymentSessionId,
              sessionId: paymentSessionId,
            },
          );
          if (emailResult.success) {
            console.log(
              "✅ Registration & payment success email sent successfully:",
              emailResult.messageId,
            );
          } else {
            console.warn(
              "⚠️ Failed to send registration & payment success email:",
              emailResult.message || emailResult.error,
            );
          }
        } catch (emailError) {
          console.error(
            "❌ Error sending registration & payment success email:",
            emailError,
          );
          // Don't fail registration if email fails
        }
      } else {
        // Send regular welcome email if no payment was required
        if (normalizedEmail) {
          try {
            console.log(
              "Attempting to send registration email to:",
              normalizedEmail,
            );
            const emailResult = await sendEmail(
              normalizedEmail,
              "userRegistration",
              {
                userName: firstName || generatedUsername,
                firstName,
                email: normalizedEmail,
                role: userRole,
                memberCode: user.memberCode,
              },
            );
            if (emailResult.success) {
              console.log(
                "✅ Registration email sent successfully:",
                emailResult.messageId,
              );
            } else {
              console.warn(
                "⚠️ Failed to send registration email:",
                emailResult.message || emailResult.error,
              );
            }
          } catch (emailError) {
            console.error("❌ Error sending registration email:", emailError);
            // Don't fail registration if email fails
          }
        }
      }

      // Generate token
      const token = generateToken(user._id);

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          memberCode: user.memberCode,
        },
      });
    }

    // Team registration validation
    if (registrationType === "team") {
      // Validate team name
      if (!teamName || teamName.trim().length < 2) {
        return res.status(400).json({
          message: "Team name is required and must be at least 2 characters",
        });
      }

      // Validate team members
      const teamValidation = validateTeamMembers(teamMembers);
      if (!teamValidation.valid) {
        return res.status(400).json({ message: teamValidation.message });
      }

      const leaderEmail = teamMembers[0]?.email?.trim()
        ? teamMembers[0].email.trim().toLowerCase()
        : "";

      if (!leaderEmail || !validateEmail(leaderEmail)) {
        return res.status(400).json({
          message: "Team leader email is required and must be verified",
        });
      }

      const teamEmailTokenCheck = verifyEmailVerificationToken(
        emailVerificationToken,
        leaderEmail,
      );
      if (!teamEmailTokenCheck.valid) {
        return res.status(400).json({ message: teamEmailTokenCheck.message });
      }

      // Check if team name already exists
      const existingTeam = await Team.findOne({
        name: { $regex: new RegExp(`^${teamName}$`, "i") },
      });
      if (existingTeam) {
        return res.status(400).json({
          message: "Team name already exists",
        });
      }

      // Check for existing users (phone, email)
      const allEmails = teamMembers
        .map((m) => (m.email?.trim() ? m.email.trim().toLowerCase() : null))
        .filter(Boolean);
      const allPhones = teamMembers
        .map((m) =>
          normalizePhoneNumber(
            String(m.phone || "").trim(),
            defaultPhoneRegion,
          ),
        )
        .filter(Boolean);

      const dupOr = [
        ...(allEmails.length ? [{ email: { $in: allEmails } }] : []),
        ...(allPhones.length ? [{ phone: { $in: allPhones } }] : []),
      ];
      const existingUsers =
        dupOr.length > 0 ? await User.find({ $or: dupOr }) : [];

      if (existingUsers.length > 0) {
        const parts = existingUsers.map((u) => u.email || u.phone);
        return res.status(400).json({
          message: `Some phone numbers or emails are already registered: ${parts.join(", ")}`,
        });
      }

      // If registration fee is required and no payment session, create payment session
      if (registrationFee > 0 && !paymentSessionId) {
        try {
          const { createRegistrationCheckoutSession } =
            await import("../services/stripe.service.js");
          const leaderEmail = teamMembers[0]?.email?.trim() || undefined;
          const paymentResult = await createRegistrationCheckoutSession({
            amount: registrationFee,
            currency: "usd",
            email: leaderEmail,
            registrationType: "team",
            metadata: {
              teamName,
              leaderEmail: leaderEmail,
              memberCount: teamMembers.length,
            },
          });

          if (paymentResult.success) {
            // Store temporary registration data (in production, use Redis or database)
            // For now, return payment URL - user will need to complete payment and re-register
            return res.json({
              requiresPayment: true,
              checkoutUrl: paymentResult.checkoutUrl,
              sessionId: paymentResult.sessionId,
              message: "Please complete payment to finish team registration",
            });
          }
        } catch (paymentError) {
          console.error("Error creating payment session:", paymentError);
          // Continue with registration if payment setup fails
        }
      }

      // If payment session provided, verify payment BEFORE creating users
      if (paymentSessionId && registrationFee > 0) {
        try {
          const { verifyPaymentSession } =
            await import("../services/stripe.service.js");
          const paymentVerification =
            await verifyPaymentSession(paymentSessionId);

          if (
            !paymentVerification.success ||
            paymentVerification.paymentStatus !== "paid"
          ) {
            // Send payment failure email (use first member's email since users aren't created yet)
            const leaderEmail = teamMembers[0]?.email;
            if (leaderEmail) {
              try {
                await sendEmail(leaderEmail, "registrationPaymentFailure", {
                  userName: teamMembers[0]?.firstName || "there",
                  amount: registrationFee,
                  reason:
                    paymentVerification.error || "Payment verification failed",
                });
              } catch (emailError) {
                console.error(
                  "Error sending payment failure email:",
                  emailError,
                );
              }
            }

            return res.status(400).json({
              message:
                "Payment not completed. Please complete payment to register.",
            });
          }
        } catch (paymentError) {
          console.error("Error verifying payment:", paymentError);

          // Send payment failure email (use first member's email since users aren't created yet)
          const leaderEmail = teamMembers[0]?.email;
          if (leaderEmail) {
            try {
              await sendEmail(leaderEmail, "registrationPaymentFailure", {
                userName: teamMembers[0]?.firstName || "there",
                amount: registrationFee,
                reason: paymentError.message || "Payment verification error",
              });
            } catch (emailError) {
              console.error("Error sending payment failure email:", emailError);
            }
          }

          return res.status(400).json({
            message: "Payment verification failed. Please try again.",
          });
        }
      }

      // Only create users AFTER payment verification (if required) succeeds
      // Create team leader (first member) - leader is active immediately
      const leaderData = teamMembers[0];
      const leaderPhone = normalizePhoneNumber(
        String(leaderData.phone || "").trim(),
        defaultPhoneRegion,
      );
      const leaderEmailOpt = leaderData.email?.trim()
        ? leaderData.email.trim().toLowerCase()
        : undefined;

      const leaderDobValidation = validateDob(leaderData.dob);
      if (!leaderDobValidation.valid) {
        return res.status(400).json({ message: leaderDobValidation.message });
      }

      const leaderUsername = await generateUniqueUsername(User, {
        email: leaderEmailOpt,
        phone: leaderPhone,
        firstName: leaderData.firstName,
        lastName: leaderData.lastName,
      });

      const leader = new User({
        username: leaderUsername,
        phone: leaderPhone,
        email: leaderEmailOpt,
        password: leaderData.password,
        firstName: leaderData.firstName,
        lastName: leaderData.lastName,
        dob: leaderDobValidation.date,
        role: "team_leader",
        isActive: true,
      });
      await leader.save();

      // Create other team members as "invited" users – no password yet, inactive until they set it
      const memberUsers = [];
      const frontendBaseUrl = getFrontendBaseUrl();
      const inviteExpiryHours = 48;
      const inviteExpiryMs = inviteExpiryHours * 60 * 60 * 1000;

      for (let i = 1; i < teamMembers.length; i++) {
        const memberData = teamMembers[i];

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + inviteExpiryMs);

        const normalizedPhone = normalizePhoneNumber(
          String(memberData.phone || "").trim(),
          defaultPhoneRegion,
        );
        const emailOpt = memberData.email?.trim()
          ? memberData.email.trim().toLowerCase()
          : undefined;

        const memberDobValidation = validateDob(memberData.dob);
        if (!memberDobValidation.valid) {
          return res.status(400).json({
            message: `Member ${i + 1}: ${memberDobValidation.message}`,
          });
        }

        const memberUsername = await generateUniqueUsername(User, {
          email: emailOpt,
          phone: normalizedPhone,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
        });

        const member = new User({
          username: memberUsername,
          phone: normalizedPhone,
          email: emailOpt,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          dob: memberDobValidation.date,
          role: "player",
          isActive: false,
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        });
        await member.save();
        memberUsers.push(member);

        const setPasswordUrlBase = `${frontendBaseUrl}/set-password?token=${resetToken}`;
        const setPasswordUrl = emailOpt
          ? `${setPasswordUrlBase}&email=${encodeURIComponent(emailOpt)}`
          : setPasswordUrlBase;

        const smsBody = `You're invited to join "${teamName}" on The Arena. Set your password: ${setPasswordUrlBase}`;

        try {
          await sendSms(normalizedPhone, smsBody);
        } catch (smsErr) {
          console.error(
            "❌ Error sending team registration invite SMS:",
            smsErr,
          );
        }

        if (emailOpt) {
          try {
            await sendEmail(emailOpt, "teamMemberInvitation", {
              userName: member.firstName || member.username,
              teamName,
              setPasswordUrl,
              expiresInHours: inviteExpiryHours,
            });
          } catch (inviteError) {
            console.error(
              "❌ Error sending team member invitation email:",
              inviteError,
            );
          }
        }
      }

      // Create team
      const team = new Team({
        name: teamName,
        leader: leader._id,
        members: [leader._id, ...memberUsers.map((m) => m._id)],
      });
      await team.save();

      // Update users with team reference
      leader.team = team._id;
      await leader.save();

      for (const member of memberUsers) {
        member.team = team._id;
        await member.save();
      }

      // Send welcome email to team leader when they have an email on file
      if (leader.email) {
        try {
          console.log(
            "Attempting to send team leader registration email to:",
            leader.email,
          );
          const emailResult = await sendEmail(
            leader.email,
            "userRegistration",
            {
              userName: leader.firstName || leader.username,
              firstName: leader.firstName,
              email: leader.email,
              role: leader.role,
              teamName,
              memberCode: leader.memberCode,
            },
          );

          if (emailResult.success) {
            console.log(
              "✅ Team leader registration email sent successfully:",
              emailResult.messageId,
            );
          } else {
            console.warn(
              "⚠️ Failed to send team leader registration email:",
              emailResult.message || emailResult.error,
            );
          }
        } catch (leaderEmailError) {
          console.error(
            "❌ Error sending team leader registration email:",
            leaderEmailError,
          );
        }
      }

      // Send registration and payment success email if payment was made
      if (paymentSessionId && registrationFee > 0 && leader.email) {
        try {
          console.log(
            "Attempting to send team registration & payment success email to:",
            leader.email,
          );
          const emailResult = await sendEmail(
            leader.email,
            "registrationPaymentSuccess",
            {
              userName: leader.firstName || leader.username,
              firstName: leader.firstName,
              email: leader.email,
              role: "team_leader",
              teamName: teamName,
              memberCode: leader.memberCode,
              amount: registrationFee,
              transactionId: paymentSessionId,
              sessionId: paymentSessionId,
            },
          );
          if (emailResult.success) {
            console.log(
              "✅ Team registration & payment success email sent successfully:",
              emailResult.messageId,
            );
          } else {
            console.warn(
              "⚠️ Failed to send team registration & payment success email:",
              emailResult.message || emailResult.error,
            );
          }
        } catch (emailError) {
          console.error(
            "❌ Error sending team registration & payment success email:",
            emailError,
          );
        }
      } else if (!paymentSessionId || registrationFee <= 0) {
        if (leader.email) {
          try {
            console.log(
              "Attempting to send team registration email to:",
              leader.email,
            );
            const emailResult = await sendEmail(
              leader.email,
              "teamRegistration",
              {
                userName: leader.firstName || leader.username,
                teamName: teamName,
                memberCount: team.members.length,
              },
            );
            if (emailResult.success) {
              console.log(
                "✅ Team registration email sent successfully:",
                emailResult.messageId,
              );
            } else {
              console.warn(
                "⚠️ Failed to send team registration email:",
                emailResult.message || emailResult.error,
              );
            }
          } catch (emailError) {
            console.error(
              "❌ Error sending team registration email:",
              emailError,
            );
          }
        }
      }

      // Generate token for team leader
      const token = generateToken(leader._id);

      return res.status(201).json({
        message: "Team registered successfully",
        token,
        user: {
          id: leader._id,
          username: leader.username,
          email: leader.email,
          phone: leader.phone,
          role: leader.role,
          firstName: leader.firstName,
          lastName: leader.lastName,
          memberCode: leader.memberCode,
          team: {
            id: team._id,
            name: team.name,
          },
        },
        team: {
          id: team._id,
          name: team.name,
          memberCount: team.members.length,
        },
      });
    }
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const submittedEmail =
        typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const submittedPhone =
        typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

      if (field === "email") {
        if (!submittedEmail) {
          return res.status(400).json({
            message:
              "A user with this phone already exists. Leave email empty or use a different value.",
          });
        }
        return res.status(400).json({ message: "Email already exists" });
      }

      if (field === "phone") {
        return res.status(400).json({ message: "Phone already exists" });
      }

      return res.status(400).json({
        message:
          submittedEmail || submittedPhone
            ? "A user with this email or phone already exists"
            : "Duplicate user data detected",
      });
    }

    // Log full error for debugging
    console.error("Full error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password, identifier } = req.body;
    const raw =
      typeof identifier === "string" && identifier.trim()
        ? identifier.trim()
        : typeof email === "string"
          ? email.trim()
          : "";

    if (!raw || !password) {
      return res.status(400).json({
        message: "Please provide email or phone and password",
      });
    }

    let user = null;
    if (raw.includes("@")) {
      user = await User.findOne({
        email: raw.toLowerCase(),
        isActive: true,
      }).select("+password");
    } else {
      const normalized = normalizePhoneNumber(raw, defaultPhoneRegion);
      if (normalized) {
        user = await User.findOne({
          phone: normalized,
          isActive: true,
        }).select("+password");
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "User account is inactive" });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        message: "Your account has been suspended",
        suspensionReason: user.suspensionReason || "No reason provided",
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        memberCode: user.memberCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server/database connection error during login",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset link via email or SMS
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const raw =
      typeof identifier === "string" && identifier.trim()
        ? identifier.trim()
        : typeof email === "string"
          ? email.trim()
          : "";

    if (!raw) {
      return res.status(400).json({
        message: "Please provide your email or phone number",
      });
    }

    let user = null;
    if (raw.includes("@")) {
      user = await User.findOne({
        email: raw.toLowerCase(),
        isActive: true,
      });
    } else {
      const normalized = normalizePhoneNumber(raw, defaultPhoneRegion);
      if (normalized) {
        user = await User.findOne({
          phone: normalized,
          isActive: true,
        });
      }
    }

    const genericMessage =
      "If an account exists with that email or phone, a password reset link has been sent.";

    if (!user || user.isSuspended) {
      return res.json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiryHours = 1;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(
      Date.now() + resetExpiryHours * 60 * 60 * 1000,
    );
    await user.save();

    const frontendBaseUrl = getFrontendBaseUrl();
    const resetUrlBase = `${frontendBaseUrl}/set-password?token=${resetToken}&mode=reset`;
    const resetPasswordUrl = user.email
      ? `${resetUrlBase}&email=${encodeURIComponent(user.email)}`
      : resetUrlBase;

    const userName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username;

    let notificationSent = false;

    if (user.email) {
      try {
        const emailResult = await sendEmail(user.email, "passwordReset", {
          userName,
          resetPasswordUrl,
          expiresInHours: resetExpiryHours,
        });
        notificationSent = emailResult.success;
      } catch (err) {
        console.error("Error sending password reset email:", err);
      }
    }

    if (!notificationSent && user.phone) {
      try {
        const smsBody = `Reset your The Arena password: ${resetPasswordUrl}`;
        const smsOutcome = await sendSms(user.phone, smsBody);
        notificationSent = !smsOutcome.skipped && Boolean(smsOutcome.sid);
      } catch (err) {
        console.error("Error sending password reset SMS:", err);
      }
    }

    if (!notificationSent) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({
      message: "Server error while processing password reset request",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/set-password
// @desc    Set password for invited users using a token (also used for activation)
// @access  Public
router.post("/set-password", async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired link. Please request a new one.",
      });
    }

    if (
      email &&
      user.email &&
      user.email.toLowerCase() !== email.toLowerCase()
    ) {
      return res.status(400).json({
        message: "Invalid or expired link. Please request a new one.",
      });
    }

    const wasInactive = !user.isActive;
    user.password = password;
    if (wasInactive) {
      user.isActive = true;
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    return res.json({
      message: wasInactive
        ? "Password set successfully. Your account is now active."
        : "Password updated successfully.",
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        memberCode: user.memberCode,
      },
    });
  } catch (error) {
    console.error("Error setting password:", error);
    res.status(500).json({
      message: "Server error while setting password",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        memberCode: req.user.memberCode,
        isActive: req.user.isActive,
        isSuspended: req.user.isSuspended,
        suspensionReason: req.user.suspensionReason,
        suspendedAt: req.user.suspendedAt,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
