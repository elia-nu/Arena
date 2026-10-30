import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generateMemberCode } from "../utils/memberCode.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      set(value) {
        if (value == null) return undefined;
        const normalized = String(value).trim().toLowerCase();
        return normalized || undefined;
      },
      validate: {
        validator(value) {
          if (value == null || value === "") return true;
          return /^\S+@\S+\.\S+$/.test(value);
        },
        message: "Please provide a valid email address",
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      set(value) {
        if (value == null) return undefined;
        const normalized = String(value).trim();
        return normalized || undefined;
      },
    },
    // Password is optional to support invite-based flows where users set it later
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["player", "admin", "team_leader"],
      default: "player",
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    parentalConsent: {
      type: Boolean,
      default: false,
    },
    isMinor: {
      type: Boolean,
      default: false,
    },
    memberCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      trim: true,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Optional fields for invite / password-reset style flows
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function (next) {
  const hasEmail = this.email && String(this.email).trim();
  const hasPhone = this.phone && String(this.phone).trim();
  if (!hasEmail && !hasPhone) {
    this.invalidate("email", "Either email or phone is required");
  }
  next();
});

// Generate member code from DOB before first save
userSchema.pre("save", async function (next) {
  if (this.isNew && this.dob && !this.memberCode) {
    try {
      const UserModel = this.constructor;
      this.memberCode = await generateMemberCode(UserModel, this.dob);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
