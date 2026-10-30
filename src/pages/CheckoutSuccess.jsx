import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoCheckmarkCircle, IoArrowForward } from "react-icons/io5";
import { useCart } from "../context/CartContext";
import { shopAPI, paymentAPI } from "../services/api";
import { useNotification } from "../components/NotificationProvider";
import { useAuth } from "../context/AuthContext";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      navigate("/cart");
      return;
    }

    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);

      // Verify payment session
      const paymentResult = await paymentAPI.verifySession(sessionId);

      if (paymentResult.success && paymentResult.paymentStatus === "paid") {
        // Clear cart
        clearCart();

        // Create order in our system using the last checkout draft
        try {
          const draftRaw = window.localStorage.getItem("lastCheckoutOrder");
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);

            const created = await shopAPI.createOrder({
              ...draft,
              paymentIntentId: paymentResult.session?.payment_intent,
              paymentMethod: "stripe",
            });

            if (created?.order) {
              setOrder(created.order);
            }

            // Clear draft once used
            window.localStorage.removeItem("lastCheckoutOrder");
          } else {
            // Fallback: try to fetch the most recent order
            const orders = await shopAPI.getOrders({ limit: 1 });
            if (orders.orders && orders.orders.length > 0) {
              setOrder(orders.orders[0]);
            }
          }
        } catch (error) {
          console.error("Error creating/fetching order:", error);
        }

        showSuccess("Payment successful! Your order has been confirmed.");
      } else {
        showError("Payment verification failed. Please contact support.");
        navigate("/cart");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      showError("Error verifying payment. Please contact support.");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-950 rounded-full" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-24 relative overflow-hidden">
      {/* Background Elements */}
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

      <div className="max-w-3xl mx-auto px-4 py-16 relative z-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Success Icon */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-24 h-24 bg-tertiary-500 rounded-full flex items-center justify-center">
              <IoCheckmarkCircle className="text-6xl text-primary-950" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-light text-primary-950 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-tertiary-500">Order</span> Confirmed
          </motion.h1>

          <motion.p
            className="text-lg text-primary-600 mb-12 max-w-xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Thank you for your purchase! Your order has been received and is
            being processed. You will receive a confirmation email shortly.
          </motion.p>

          {order && (
            <motion.div
              className="bg-secondary-50 border border-primary-200 p-8 mb-8 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <h2 className="text-xl font-medium text-primary-950 mb-4">
                Order Details
              </h2>
              <div className="space-y-2 text-sm text-primary-600">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-medium text-primary-950">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium text-primary-950">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-primary-950 capitalize">
                    {order.status}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <button
              onClick={() => navigate("/orders")}
              className="px-8 py-4 bg-primary-950 text-secondary-50 text-sm font-medium hover:bg-primary-900 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>View Orders</span>
              <IoArrowForward />
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="px-8 py-4 border border-primary-300 text-primary-700 text-sm font-medium hover:border-primary-950 hover:text-primary-950 transition-colors inline-flex items-center justify-center gap-2"
            >
              Continue Shopping
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

