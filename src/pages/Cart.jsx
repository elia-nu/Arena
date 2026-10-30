import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  IoTrash,
  IoAdd,
  IoRemove,
  IoArrowBack,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoLockClosed,
} from "react-icons/io5";
import { useCart } from "../context/CartContext";
import { useNotification } from "../components/NotificationProvider";
import { shopAPI, contactAPI } from "../services/api";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import { useAuth } from "../context/AuthContext";
import CheckoutModal from "../components/shop/CheckoutModal";
import EmptyState from "../components/EmptyState";

const Cart = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    applyCoupon,
    coupon,
  } = useCart();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [shopPageEnabled, setShopPageEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        const enabled = data?.contactInfo?.shopPageEnabled;
        setShopPageEnabled(typeof enabled === "boolean" ? enabled : true);
      } catch (error) {
        console.error("Error loading site settings:", error);
        setShopPageEnabled(true);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const subtotal = getCartTotal();
  const discount = coupon?.discount || 0;
  const tax = 0;
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getMaxQuantity = (item) => {
    const stock = Number(item?.stock);
    if (Number.isFinite(stock) && stock >= 0) {
      return Math.max(1, Math.min(99, Math.floor(stock)));
    }
    return 99;
  };

  const handleQuantityChange = (id, change) => {
    const item = cart.find((item) => item.id === id || item._id === id);
    if (!item) return;
    const maxQty = getMaxQuantity(item);
    const newQuantity = Math.max(1, Math.min(maxQty, item.quantity + change));
    updateQuantity(id, newQuantity);
  };

  const handleQuantityInput = (id, value) => {
    const item = cart.find((cartItem) => cartItem.id === id || cartItem._id === id);
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    const maxQty = getMaxQuantity(item);
    updateQuantity(id, Math.max(1, Math.min(maxQty, parsed)));
  };

  const handleRemoveItem = (id) => {
    setRemovingId(id);
    window.setTimeout(() => {
      removeFromCart(id);
      setRemovingId(null);
      showSuccess("Item removed from cart");
    }, 180);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await shopAPI.validateCoupon(couponCode, subtotal);

      if (response.valid) {
        applyCoupon({
          code: response.coupon.code,
          name: response.coupon.name,
          discountType: response.coupon.discountType,
          discountValue: response.coupon.discountValue,
          discount: response.discount,
        });
        showSuccess("Coupon applied successfully!");
        setCouponCode("");
      } else {
        setCouponError(response.message || "Invalid coupon code");
      }
    } catch (error) {
      setCouponError(
        error.message || "Failed to validate coupon. Please try again."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponCode("");
    setCouponError("");
    showSuccess("Coupon removed");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError("Your cart is empty");
      return;
    }

    if (!user) {
      showError("Please login to continue");
      navigate("/login?redirect=/cart");
      return;
    }

    setIsProcessing(true);

    const data = {
      items: cart.map((item) => ({
        product: item._id || item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        image: item.image || item.images?.[0],
        sku: item.sku,
      })),
      email: user.email,
      userId: user._id || user.id,
      subtotal,
      discount,
      coupon: coupon || null,
      tax,
      total,
    };

    setCheckoutData(data);
    setShowCheckoutModal(true);
    setIsProcessing(false);
  };

  const handleCheckoutSuccess = (order) => {
    navigate(`/checkout/success?order=${order._id || order.id}`);
  };

  const OrderSummary = ({ sticky = false, showMobileCheckout = false }) => (
    <div
      className={`bg-secondary-50 border border-secondary-200 p-4 sm:p-6 space-y-6 ${
        sticky ? "lg:sticky lg:top-24" : ""
      }`}
    >
      <div className="flex items-center gap-2 pb-4 border-b border-secondary-200">
        <h2 className="text-xl font-medium text-secondary-600">
          Order Summary
        </h2>
      </div>

      <div className="space-y-3">
        {coupon ? (
          <div className="bg-secondary-200 border border-secondary-300 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IoCheckmarkCircle className="text-secondary-600" />
                <span className="text-sm font-medium text-primary-950">
                  {coupon.name}
                </span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-primary-400 hover:text-primary-950 transition-colors"
                aria-label="Remove coupon"
              >
                <IoCloseCircle className="text-lg" />
              </button>
            </div>
            <p className="text-xs text-primary-600">Code: {coupon.code}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary-700">
              Coupon Code
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCoupon();
                }}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-secondary-200 focus:border-secondary-500 outline-none text-sm bg-transparent"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2 bg-secondary-500 text-primary-950 text-sm font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-500">{couponError}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-secondary-200 pt-4">
        <div className="flex justify-between text-sm text-primary-600">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-secondary-600 font-medium">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-secondary-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-primary-950">Total</span>
            <span className="text-2xl font-light text-secondary-600">
              ${total.toFixed(2)}
            </span>
          </div>
          {discount > 0 && (
            <p className="text-xs text-secondary-600 mt-2 text-right">
              You save ${discount.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {!user && (
        <div className="flex items-start gap-3 p-3 border border-secondary-300 bg-secondary-100/60">
          <IoLockClosed className="text-secondary-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-primary-700">
            <p className="font-medium text-primary-950 mb-1">
              Login required to checkout
            </p>
            <Link
              to="/login?redirect=/cart"
              className="text-secondary-700 underline underline-offset-2 hover:text-secondary-800"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <motion.button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className="w-full py-4 bg-primary-950 text-secondary-500 text-sm font-medium hover:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          whileHover={
            !isProcessing && cart.length > 0 ? { scale: 1.02 } : {}
          }
          whileTap={!isProcessing && cart.length > 0 ? { scale: 0.98 } : {}}
        >
          <span className="relative z-10">
            {isProcessing
              ? "Processing..."
              : user
                ? "Proceed to Checkout"
                : "Login to Checkout"}
          </span>
          {!isProcessing && cart.length > 0 && (
            <motion.div
              className="absolute inset-0 bg-secondary-500"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-primary-950 font-medium">
                {user ? "Proceed to Checkout" : "Login to Checkout"}
              </span>
            </motion.div>
          )}
        </motion.button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear your cart?")) {
              clearCart();
              showSuccess("Cart cleared");
            }
          }}
          className="w-full py-3 border border-secondary-200 bg-secondary-50 text-primary-700 text-sm font-medium hover:border-secondary-400 hover:bg-secondary-100 hover:text-primary-950 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="pt-6 border-t border-secondary-200">
        <p className="text-xs text-primary-500 text-center">
          Secure checkout • Free returns • Fast shipping
        </p>
      </div>

      {showMobileCheckout && (
        <p className="text-xs text-primary-400 text-center lg:hidden">
          Review your items above before checkout
        </p>
      )}
    </div>
  );

  if (settingsLoaded && !shopPageEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 sm:pt-28 pb-16">
        <EmptyState
          variant="shop"
          title="Shop is offline"
          description="Our shop is currently disabled by the site administrator. Please check back later."
          actionLabel="Back to home"
          actionTo="/"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-24 relative overflow-hidden pb-28 lg:pb-0">
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${
              getComputedStyle(document.documentElement).getPropertyValue(
                "--color-primary-950"
              ) || "#000000"
            } 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary-500 rounded-full blur-[200px] opacity-5"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 relative z-10">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 px-6 py-2 border border-secondary-200 bg-secondary-50">
              <div className="w-2 h-2 bg-secondary-500 rounded-full" />
              <span className="text-primary-950 text-xs font-light tracking-[0.3em] uppercase">
                Shopping Cart
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-8xl font-light text-primary-950 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="text-secondary-500">Your</span> Cart
              {itemCount > 0 && (
                <span className="block md:inline text-base md:text-lg font-normal text-primary-500 md:ml-4 tracking-normal">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </motion.h1>

            <Link
              to="/shop"
              className="w-full md:w-auto justify-center md:justify-start flex items-center gap-2 px-6 py-3 border border-secondary-300 bg-secondary-50 hover:bg-secondary-100 hover:border-secondary-500 text-sm text-primary-700 hover:text-primary-950 transition-all"
            >
              <IoArrowBack className="text-lg" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>

        {cart.length === 0 ? (
          <EmptyState
            variant="cart"
            title="Your cart is empty"
            description="Looks like you haven't added anything yet. Grab some official gear and fill it up."
            actionLabel="Browse products"
            actionTo="/shop"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              className="lg:col-span-2 space-y-4 sm:space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => {
                  const itemId = item.id || item._id;
                  return (
                    <motion.div
                      key={itemId}
                      layout
                      className={`bg-secondary-50 border border-secondary-200 hover:border-secondary-400 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 transition-colors ${
                        removingId === itemId ? "opacity-50" : ""
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.35,
                      }}
                    >
                      <Link
                        to={`/shop/product/${itemId}`}
                        className="flex-shrink-0 w-full sm:w-32 h-52 sm:h-32 md:w-40 md:h-40 overflow-hidden border border-secondary-200 hover:border-secondary-500 transition-colors bg-primary-50"
                      >
                        <img
                          src={
                            absoluteMediaSrc(
                              item.image || item.images?.[0]
                            ) || "/placeholder-product.jpg"
                          }
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/shop/product/${itemId}`}
                              className="text-base sm:text-lg font-medium text-primary-950 hover:text-secondary-600 transition-colors block mb-2"
                            >
                              {item.name}
                            </Link>
                            {item.description && (
                              <p className="text-sm text-primary-600 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <motion.button
                            onClick={() => handleRemoveItem(itemId)}
                            className="flex-shrink-0 text-primary-400 hover:text-red-600 transition-colors p-2"
                            aria-label="Remove item"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IoTrash className="text-xl" />
                          </motion.button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
                          <div>
                            <p className="text-xl sm:text-2xl font-light text-primary-950">
                              ${Number(item.price).toFixed(2)}
                            </p>
                            <p className="text-xs text-primary-400 mt-1">
                              each
                            </p>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex items-center gap-1 border border-secondary-200 bg-secondary-50">
                              <button
                                onClick={() =>
                                  handleQuantityChange(itemId, -1)
                                }
                                className="p-2 hover:bg-secondary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <IoRemove className="text-sm text-primary-600" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityInput(itemId, e.target.value)
                                }
                                className="text-sm text-primary-950 w-10 text-center font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label="Quantity"
                              />
                              <button
                                onClick={() =>
                                  handleQuantityChange(itemId, 1)
                                }
                                className="p-2 hover:bg-secondary-100 transition-colors disabled:opacity-50"
                                disabled={item.quantity >= 99}
                                aria-label="Increase quantity"
                              >
                                <IoAdd className="text-sm text-primary-600" />
                              </button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="text-base sm:text-lg font-medium text-primary-950">
                                $
                                {(
                                  Number(item.price) * item.quantity
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <OrderSummary sticky />
            </motion.div>
          </div>
        )}
      </div>

      {/* Sticky mobile checkout bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-secondary-200 bg-secondary-50/95 backdrop-blur-sm p-3 safe-area-pb">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary-500 uppercase tracking-wider">
                Total
              </p>
              <p className="text-lg font-medium text-primary-950">
                ${total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 max-w-[220px] py-3 bg-primary-950 text-secondary-500 text-sm font-medium hover:bg-primary-900 transition-colors disabled:opacity-50"
            >
              {user ? "Checkout" : "Login to Checkout"}
            </button>
          </div>
        </div>
      )}

      {showCheckoutModal && checkoutData && (
        <CheckoutModal
          orderData={checkoutData}
          onClose={() => {
            setShowCheckoutModal(false);
            setCheckoutData(null);
          }}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

export default Cart;
