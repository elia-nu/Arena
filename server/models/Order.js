import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
  },
  sku: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coupon: {
      code: String,
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      discountValue: Number,
    },
    shipping: {
      cost: {
        type: Number,
        default: 0,
        min: 0,
      },
      method: {
        type: String,
        enum: ["standard", "express", "overnight"],
        default: "standard",
      },
      recipientName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        apartment: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "apple_pay", "paypal", "zelle", "cash_app", "other"],
    },
    paymentIntentId: {
      type: String,
    },
    // Zelle payment details
    zellePayment: {
      sendersName: {
        type: String,
      },
      email: {
        type: String,
      },
      amount: {
        type: Number,
      },
      transactionReference: {
        type: String,
      },
      verificationNotes: {
        type: String,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: {
        type: Date,
      },
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    cancelledAt: {
      type: Date,
    },
    cancelledReason: {
      type: String,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
// Note: paymentStatus and orderNumber already have index: true/unique: true in field definitions

// Virtual for order status display
orderSchema.virtual("statusDisplay").get(function () {
  const statusMap = {
    pending: "Pending",
    queued: "Queued",
    processing: "Processing",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return statusMap[this.status] || this.status;
});

// Method to generate order number
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Pre-save hook to generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = this.constructor.generateOrderNumber();
      const existing = await this.constructor.findOne({ orderNumber });
      if (!existing) {
        isUnique = true;
      }
    }
    this.orderNumber = orderNumber;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

