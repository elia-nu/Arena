import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["apparel", "accessories", "equipment"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one image is required",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    promotion: {
      active: {
        type: Boolean,
        default: false,
      },
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      discountValue: {
        type: Number,
        min: 0,
      },
      startDate: Date,
      endDate: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ "promotion.active": 1, "promotion.endDate": 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

// Virtual for calculating discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for checking if product is in stock
productSchema.virtual("inStock").get(function () {
  return this.stock > 0 && this.status === "active";
});

// Method to calculate final price with promotion
productSchema.methods.getFinalPrice = function () {
  if (this.promotion?.active) {
    const now = new Date();
    if (
      (!this.promotion.startDate || now >= this.promotion.startDate) &&
      (!this.promotion.endDate || now <= this.promotion.endDate)
    ) {
      if (this.promotion.discountType === "percentage") {
        return (
          this.price * (1 - this.promotion.discountValue / 100)
        ).toFixed(2);
      } else if (this.promotion.discountType === "fixed") {
        return Math.max(0, this.price - this.promotion.discountValue).toFixed(2);
      }
    }
  }
  return this.price.toFixed(2);
};

// Method to check if promotion is currently active
productSchema.methods.isPromotionActive = function () {
  if (!this.promotion?.active) return false;
  const now = new Date();
  return (
    (!this.promotion.startDate || now >= this.promotion.startDate) &&
    (!this.promotion.endDate || now <= this.promotion.endDate)
  );
};

const Product = mongoose.model("Product", productSchema);

export default Product;

