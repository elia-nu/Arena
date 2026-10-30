import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Coupon name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userLimit: {
      type: Number,
      min: 1,
    },
    applicableCategories: {
      type: [String],
      enum: ["apparel", "accessories", "equipment"],
      default: [],
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function (cartTotal = 0, userId = null) {
  const now = new Date();

  // Check status
  if (this.status !== "active") {
    return { valid: false, reason: "Coupon is not active" };
  }

  // Check date validity
  if (now < this.validFrom) {
    return { valid: false, reason: "Coupon is not yet valid" };
  }

  if (now > this.validUntil) {
    return { valid: false, reason: "Coupon has expired" };
  }

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  // Check minimum purchase
  if (cartTotal < this.minPurchase) {
    return {
      valid: false,
      reason: `Minimum purchase of $${this.minPurchase} required`,
    };
  }

  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (cartTotal) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (cartTotal * this.discountValue) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else if (this.discountType === "fixed") {
    discount = Math.min(this.discountValue, cartTotal);
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCoupon = async function (
  code,
  cartTotal = 0,
  userId = null
) {
  const coupon = await this.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    return { valid: false, reason: "Coupon not found" };
  }

  const validation = coupon.isValid(cartTotal, userId);
  if (!validation.valid) {
    return validation;
  }

  return { valid: true, coupon };
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

