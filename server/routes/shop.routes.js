import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// ==================== PRODUCT ROUTES ====================

// Get all products (public)
router.get("/products", async (req, res) => {
  try {
    const {
      category,
      status = "active",
      featured,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Featured filter
    if (featured === "true") {
      query.featured = true;
    }

    // Stock filter
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .select("-__v")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    // Calculate final prices with promotions
    const productsWithPromotions = products.map((product) => {
      const finalPrice = product.promotion?.active
        ? product.promotion.discountType === "percentage"
          ? product.price * (1 - product.promotion.discountValue / 100)
          : Math.max(0, product.price - product.promotion.discountValue)
        : product.price;

      return {
        ...product,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        inStock: product.stock > 0 && product.status === "active",
      };
    });

    res.json({
      products: productsWithPromotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Server error fetching products",
      error: error.message,
    });
  }
});

// Get single product (public)
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate final price with promotion
    const finalPrice = product.promotion?.active
      ? product.promotion.discountType === "percentage"
        ? product.price * (1 - product.promotion.discountValue / 100)
        : Math.max(0, product.price - product.promotion.discountValue)
      : product.price;

    res.json({
      ...product,
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      inStock: product.stock > 0 && product.status === "active",
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      message: "Server error fetching product",
      error: error.message,
    });
  }
});

// Admin: Create product
router.post(
  "/products",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user._id,
      };

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        message: "Server error creating product",
        error: error.message,
      });
    }
  }
);

// Admin: Update product
router.put(
  "/products/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const productData = {
        ...req.body,
        updatedBy: req.user._id,
      };

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        productData,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Server error updating product",
        error: error.message,
      });
    }
  }
);

// Admin: Delete product
router.delete(
  "/products/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        message: "Server error deleting product",
        error: error.message,
      });
    }
  }
);

// Admin: Bulk update products
router.post(
  "/products/bulk-update",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { ids, updates } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Product IDs are required" });
      }

      updates.updatedBy = req.user._id;

      const result = await Product.updateMany(
        { _id: { $in: ids } },
        { $set: updates }
      );

      res.json({
        message: `${result.modifiedCount} products updated successfully`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Error bulk updating products:", error);
      res.status(500).json({
        message: "Server error bulk updating products",
        error: error.message,
      });
    }
  }
);

// ==================== ORDER ROUTES ====================

// Get user's orders
router.get("/orders", authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Server error fetching orders",
      error: error.message,
    });
  }
});

// Get single order
router.get("/orders/:id", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.product", "name images")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Server error fetching order",
      error: error.message,
    });
  }
});

// Create order (after payment)
router.post("/orders", authenticate, async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      coupon,
      shipping,
      tax,
      total,
      paymentIntentId,
      paymentMethod,
      zellePayment,
      paymentStatus,
      status,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have items" });
    }

    // Validate delivery address
    if (
      !shipping?.recipientName?.trim() ||
      !shipping?.phone?.trim() ||
      !shipping?.address?.street?.trim() ||
      !shipping?.address?.city?.trim() ||
      !shipping?.address?.state?.trim() ||
      !shipping?.address?.zipCode?.trim() ||
      !shipping?.address?.country?.trim()
    ) {
      return res.status(400).json({
        message:
          "Delivery address is required. Please provide recipient name, phone, and full shipping address.",
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }
    }

    // Create order
    const orderData = {
      user: req.user._id,
      items,
      subtotal,
      discount: discount || 0,
      coupon: coupon || null,
      shipping: shipping || { cost: 0, method: "standard" },
      tax: tax || 0,
      total,
      paymentMethod: paymentMethod || "stripe",
    };

    // Handle payment method specific data
    const isManualPayment = ["zelle", "cash_app"].includes(paymentMethod);
    if (isManualPayment) {
      // Manual payments are pending until manually verified
      orderData.paymentStatus = paymentStatus || "pending";
      orderData.status = status || "pending";
      if (zellePayment) {
        orderData.zellePayment = zellePayment;
      }
    } else {
      // Stripe payments are confirmed immediately
      orderData.paymentStatus = paymentStatus || "paid";
      orderData.status = status || "confirmed";
      if (paymentIntentId) {
        orderData.paymentIntentId = paymentIntentId;
      }
    }

    // Generate order number explicitly to satisfy required validation
    orderData.orderNumber = Order.generateOrderNumber();

    const order = new Order(orderData);
    await order.save();

    // Update stock only if payment is confirmed (not for pending manual payments)
    if (orderData.paymentStatus === "paid") {
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // Update coupon usage if applicable
    if (coupon?.code) {
      await Coupon.findOneAndUpdate(
        { code: coupon.code },
        { $inc: { usageCount: 1 } }
      );
    }

    // Send order confirmation email
    try {
      const { sendEmail } = await import("../services/email.service.js");
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.user._id);
      
      if (user && user.email) {
        const populatedOrder = await Order.findById(order._id)
          .populate("items.product", "name price images")
          .lean();

        const emailTemplate = isManualPayment
          ? "orderConfirmationZelle"
          : "orderConfirmation";
        
        const formatShippingAddress = (ship) => {
          if (!ship?.address?.street) return null;
          const lines = [
            ship.recipientName,
            ship.phone,
            ship.address.apartment
              ? `${ship.address.street}, ${ship.address.apartment}`
              : ship.address.street,
            `${ship.address.city}, ${ship.address.state} ${ship.address.zipCode}`,
            ship.address.country,
          ].filter(Boolean);
          return lines.join("<br>");
        };

        await sendEmail(user.email, emailTemplate, {
          userName: user.firstName || user.username,
          firstName: user.firstName,
          memberCode: user.memberCode,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          itemCount: items.length,
          items: populatedOrder.items.map(item => ({
            name: item.product?.name || item.name || "Product",
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: subtotal,
          discount: discount || 0,
          shipping: shipping?.cost || 0,
          tax: tax,
          total: total,
          paymentMethod: paymentMethod,
          requiresVerification: isManualPayment,
          shippingAddress: formatShippingAddress(shipping),
        });
      }
    } catch (emailError) {
      console.error("Error sending order confirmation email:", emailError);
      // Don't fail order creation if email fails
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Server error creating order",
      error: error.message,
    });
  }
});

// Update order status (user can cancel)
router.put("/orders/:id/status", authenticate, async (req, res) => {
  try {
    const { status, reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Users can only cancel pending/processing orders
    if (status === "cancelled") {
      if (!["pending", "processing"].includes(order.status)) {
        return res.status(400).json({
          message: "Cannot cancel order in current status",
        });
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancelledReason = reason || "Cancelled by user";

      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      await order.save();
      return res.json({
        message: "Order cancelled successfully",
        order,
      });
    }

    res.status(400).json({ message: "Invalid status update" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Server error updating order status",
      error: error.message,
    });
  }
});

// Admin: Get all orders
router.get(
  "/admin/orders",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const {
        status,
        paymentStatus,
        paymentMethod,
        user,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      const query = {};

      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (user) query.user = user;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate("user", "username email firstName lastName")
          .populate("items.product", "name images")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(query),
      ]);

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({
        message: "Server error fetching orders",
        error: error.message,
      });
    }
  }
);

// Admin: Update order
router.put(
  "/admin/orders/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status, trackingNumber, notes, paymentStatus, verificationNotes } = req.body;

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Handle manual payment verification
      if (
        paymentStatus === "paid" &&
        ["zelle", "cash_app"].includes(order.paymentMethod) &&
        order.paymentStatus === "pending"
      ) {
        order.paymentStatus = "paid";
        order.status = status || "confirmed";
        
        // Update manual payment verification details
        if (!order.zellePayment) {
          order.zellePayment = {};
        }
        order.zellePayment.verifiedBy = req.user._id;
        order.zellePayment.verifiedAt = new Date();
        if (verificationNotes) {
          order.zellePayment.verificationNotes = verificationNotes;
        }

        // Update stock when payment is verified
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }

        // Send confirmation email
        try {
          const { sendEmail } = await import("../services/email.service.js");
          const User = (await import("../models/User.js")).default;
          const user = await User.findById(order.user);
          
          if (user && user.email) {
            const populatedOrder = await Order.findById(order._id)
              .populate("items.product", "name price images")
              .lean();

            await sendEmail(user.email, "orderConfirmation", {
              userName: user.firstName || user.username,
              firstName: user.firstName,
              memberCode: user.memberCode,
              orderNumber: order.orderNumber,
              orderDate: order.createdAt,
              itemCount: order.items.length,
              items: populatedOrder.items.map(item => ({
                name: item.product?.name || item.name || "Product",
                quantity: item.quantity,
                price: item.price,
              })),
              subtotal: order.subtotal,
              discount: order.discount || 0,
              shipping: order.shipping?.cost || 0,
              tax: order.tax,
              total: order.total,
              paymentMethod: order.paymentMethod,
              requiresVerification: false,
            });
          }
        } catch (emailError) {
          console.error("Error sending payment verification email:", emailError);
          // Don't fail the verification if email fails
        }
      }

      // Allow non-paid payment status transitions (e.g. pending -> failed on rejection)
      if (paymentStatus && paymentStatus !== "paid") {
        order.paymentStatus = paymentStatus;
      }

      if (status) {
        const oldStatus = order.status;
        order.status = status;

        if (status === "shipped" && !order.shippedAt) {
          order.shippedAt = new Date();
        }
        if (status === "delivered" && !order.deliveredAt) {
          order.deliveredAt = new Date();
        }

        // If cancelling, restore stock
        if (
          status === "cancelled" &&
          oldStatus !== "cancelled" &&
          order.paymentStatus === "paid"
        ) {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });
          }
        }
      }

      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (notes !== undefined) order.notes = notes;

      await order.save();

      res.json({
        message: "Order updated successfully",
        order,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        message: "Server error updating order",
        error: error.message,
      });
    }
  }
);

// Admin: Verify Zelle payment
router.post(
  "/admin/orders/:id/verify-zelle",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { verificationNotes } = req.body;

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (!["zelle", "cash_app"].includes(order.paymentMethod)) {
        return res.status(400).json({
          message: "This order is not a manual payment",
        });
      }

      if (order.paymentStatus === "paid") {
        return res.status(400).json({ message: "This payment has already been verified" });
      }

      // Verify the payment
      order.paymentStatus = "paid";
      order.status = "confirmed";
      
      if (!order.zellePayment) {
        order.zellePayment = {};
      }
      order.zellePayment.verifiedBy = req.user._id;
      order.zellePayment.verifiedAt = new Date();
      if (verificationNotes) {
        order.zellePayment.verificationNotes = verificationNotes;
      }

      // Update stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      await order.save();

      // Send confirmation email
      try {
        const { sendEmail } = await import("../services/email.service.js");
        const User = (await import("../models/User.js")).default;
        const user = await User.findById(order.user);
        
        if (user && user.email) {
          const populatedOrder = await Order.findById(order._id)
            .populate("items.product", "name price images")
            .lean();

          await sendEmail(user.email, "orderConfirmation", {
            userName: user.firstName || user.username,
            firstName: user.firstName,
            memberCode: user.memberCode,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            itemCount: order.items.length,
            items: populatedOrder.items.map(item => ({
              name: item.product?.name || item.name || "Product",
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: order.subtotal,
            discount: order.discount || 0,
            shipping: order.shipping?.cost || 0,
            tax: order.tax,
            total: order.total,
            paymentMethod: "zelle",
            requiresVerification: false,
          });
        }
      } catch (emailError) {
        console.error("Error sending payment verification email:", emailError);
        // Don't fail the verification if email fails
      }

      res.json({
        message: "Payment verified successfully",
        order,
      });
    } catch (error) {
      console.error("Error verifying Zelle payment:", error);
      res.status(500).json({
        message: "Server error verifying payment",
        error: error.message,
      });
    }
  }
);

// Admin: Get pending Zelle payments
router.get(
  "/admin/orders/pending-zelle",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;

      const query = {
        paymentMethod: { $in: ["zelle", "cash_app"] },
        paymentStatus: "pending",
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate("user", "username email firstName lastName")
          .populate("items.product", "name images")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(query),
      ]);

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching pending Zelle payments:", error);
      res.status(500).json({
        message: "Server error fetching pending Zelle payments",
        error: error.message,
      });
    }
  }
);

// ==================== COUPON ROUTES ====================

// Validate coupon (public)
router.post("/coupons/validate", async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const result = await Coupon.findValidCoupon(
      code,
      parseFloat(cartTotal) || 0
    );

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        message: result.reason,
      });
    }

    const discount = result.coupon.calculateDiscount(
      parseFloat(cartTotal) || 0
    );

    res.json({
      valid: true,
      coupon: {
        code: result.coupon.code,
        name: result.coupon.name,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        maxDiscount: result.coupon.maxDiscount,
      },
      discount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      message: "Server error validating coupon",
      error: error.message,
    });
  }
});

// Admin: Get all coupons
router.get(
  "/admin/coupons",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;

      const query = {};
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [coupons, total] = await Promise.all([
        Coupon.find(query)
          .populate("createdBy", "username email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Coupon.countDocuments(query),
      ]);

      res.json({
        coupons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({
        message: "Server error fetching coupons",
        error: error.message,
      });
    }
  }
);

// Admin: Create coupon
router.post(
  "/admin/coupons",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const couponData = {
        ...req.body,
        createdBy: req.user._id,
      };

      const coupon = new Coupon(couponData);
      await coupon.save();

      res.status(201).json({
        message: "Coupon created successfully",
        coupon,
      });
    } catch (error) {
      console.error("Error creating coupon:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Coupon code already exists",
        });
      }
      res.status(500).json({
        message: "Server error creating coupon",
        error: error.message,
      });
    }
  }
);

// Admin: Update coupon
router.put(
  "/admin/coupons/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      res.json({
        message: "Coupon updated successfully",
        coupon,
      });
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({
        message: "Server error updating coupon",
        error: error.message,
      });
    }
  }
);

// Admin: Delete coupon
router.delete(
  "/admin/coupons/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);

      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({
        message: "Server error deleting coupon",
        error: error.message,
      });
    }
  }
);

// ==================== STATS ROUTES ====================

// Admin: Get shop stats
router.get(
  "/admin/stats",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalCoupons,
        activeCoupons,
      ] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ status: "active" }),
        Product.countDocuments({ stock: { $lt: 10 }, status: "active" }),
        Order.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.aggregate([
          {
            $match: { paymentStatus: "paid" },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total" },
            },
          },
        ]),
        Coupon.countDocuments(),
        Coupon.countDocuments({ status: "active" }),
      ]);

      res.json({
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
        },
        coupons: {
          total: totalCoupons,
          active: activeCoupons,
        },
      });
    } catch (error) {
      console.error("Error fetching shop stats:", error);
      res.status(500).json({
        message: "Server error fetching shop stats",
        error: error.message,
      });
    }
  }
);

export default router;

