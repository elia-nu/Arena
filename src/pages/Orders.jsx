import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { IoArrowBack, IoCheckmarkCircle, IoTime, IoCar, IoCloseCircle } from "react-icons/io5";
import { shopAPI } from "../services/api";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import { useNotification } from "../components/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";

const Orders = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await shopAPI.getOrders(params);
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <IoCheckmarkCircle className="text-green-500" />;
      case "shipped":
        return <IoCar className="text-blue-500" />;
      case "cancelled":
        return <IoCloseCircle className="text-red-500" />;
      default:
        return <IoTime className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200";
      case "shipped":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-primary-600 mb-4">
            Please login to view your orders
          </p>
          <Link
            to="/login"
            className="px-6 py-3 bg-primary-950 text-secondary-50 text-sm font-medium hover:bg-primary-900 transition-colors inline-block"
          >
            Login
          </Link>
        </div>
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

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        {/* Header */}
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
            <div className="flex items-center gap-3 px-6 py-2 border border-primary-950/10 bg-primary-950/5">
              <div className="w-2 h-2 bg-tertiary-500 rounded-full" />
              <span className="text-primary-950 text-xs font-light tracking-[0.3em] uppercase">
                My Orders
              </span>
            </div>
          </motion.div>

          <div className="flex items-center justify-between">
            <motion.h1
              className="text-6xl md:text-8xl font-light text-primary-950 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="text-tertiary-500">Order</span> History
            </motion.h1>

            <Link
              to="/shop"
              className="flex items-center gap-2 px-6 py-3 border border-primary-300 hover:border-primary-950 text-sm text-primary-700 hover:text-primary-950 transition-all"
            >
              <IoArrowBack className="text-lg" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex gap-2 mb-8 pb-8 border-b border-primary-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  filter === status
                    ? "bg-primary-950 text-secondary-50"
                    : "bg-secondary-50 border border-primary-300 text-primary-700 hover:border-primary-950 hover:text-primary-950"
                }`}
              >
                {status}
              </button>
            )
          )}
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-950 rounded-full" />
            </motion.div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                className="bg-secondary-50 border border-primary-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(order.status)}
                      <h3 className="text-lg font-medium text-primary-950">
                        Order #{order.orderNumber}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium uppercase tracking-wider border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-primary-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-sm text-primary-600 mt-1">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-primary-950">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-primary-600">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4 border-t border-primary-200 pt-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <img
                        src={absoluteMediaSrc(item.image) || "/placeholder-product.jpg"}
                        alt={item.name}
                        className="w-20 h-20 object-cover border border-primary-200"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-primary-950 mb-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-primary-600">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary-950">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="orders"
            title="No orders found"
            description="When you place an order, it will show up here. Browse the shop to get started."
            actionLabel="Start shopping"
            actionTo="/shop"
          />
        )}
      </div>
    </div>
  );
};

export default Orders;

