import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IoCheckmarkCircle, IoTime, IoCar, IoCloseCircle } from "react-icons/io5";
import { shopAPI } from "../../services/api";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import { useNotification } from "../NotificationProvider";
import { useAuth } from "../../context/AuthContext";

const MyOrders = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <p className="text-sm text-primary-600">
        Please login to view your orders.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                filter === status
                  ? "bg-primary-950 text-secondary-50"
                  : "bg-secondary-50 border border-primary-200 text-primary-700 hover:border-primary-900 hover:text-primary-900"
              }`}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-950 rounded-full" />
          </motion.div>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              className="bg-secondary-50 border border-primary-200 rounded-lg p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(order.status)}
                    <h3 className="text-sm font-medium text-primary-950">
                      Order #{order.orderNumber}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-primary-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-light text-primary-950">
                    ${order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-primary-600">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 border-t border-primary-200 pt-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <img
                      src={absoluteMediaSrc(item.image) || "/placeholder-product.jpg"}
                      alt={item.name}
                      className="w-14 h-14 object-cover border border-primary-200 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary-950">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-primary-600">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-primary-950">
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
        <p className="text-sm text-primary-600 text-center py-6">
          No orders found yet.
        </p>
      )}
    </div>
  );
};

export default MyOrders;


