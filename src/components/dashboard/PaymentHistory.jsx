import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  IoReceipt,
  IoCheckmarkCircle,
  IoTime,
  IoFilter,
  IoCart,
  IoTrophy,
  IoCash,
} from "react-icons/io5";

const PaymentHistory = ({ payments = [], orders = [] }) => {
  const [filter, setFilter] = useState("all"); // all, paid, pending, rejected, orders

  // Combine tournament payments and shop orders
  const allPayments = useMemo(() => {
    const combined = [];

    // Add tournament/event payments
    payments.forEach((payment) => {
      combined.push({
        ...payment,
        type: "event",
        paymentDate: payment.date,
      });
    });

    // Add shop orders
    orders.forEach((order) => {
      const mappedStatus =
        order.paymentStatus === "paid"
          ? "paid"
          : order.paymentStatus === "failed"
            ? "rejected"
            : order.status === "delivered"
              ? "paid"
              : "pending";

      combined.push({
        id: order._id || order.id,
        type: "order",
        eventName: `Order #${order.orderNumber || order._id}`,
        description: order.items?.map((item) => item.product?.name || item.name).join(", ") || "Shop Order",
        amount: order.total || order.amount || 0,
        paymentDate: order.createdAt || order.date,
        status: mappedStatus,
        transactionId: order.paymentIntentId || order.transactionId,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
      });
    });

    return combined.sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.date || 0);
      const dateB = new Date(b.paymentDate || b.date || 0);
      return dateB - dateA; // Most recent first
    });
  }, [payments, orders]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      switch (filter) {
        case "paid":
          return payment.status === "paid";
        case "pending":
          return payment.status === "pending";
        case "rejected":
          return payment.status === "rejected";
        case "orders":
          return payment.type === "order";
        default:
          return true;
      }
    });
  }, [allPayments, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPaid = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalPending = allPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalOrders = allPayments.filter((p) => p.type === "order").length;
    const totalEvents = allPayments.filter((p) => p.type === "event").length;

    return { totalPaid, totalPending, totalOrders, totalEvents, total: allPayments.length };
  }, [allPayments]);

  const getPaymentTypeIcon = (type) => {
    switch (type) {
      case "order":
        return <IoCart className="text-blue-500" />;
      case "event":
        return <IoTrophy className="text-amber-500" />;
      default:
        return <IoReceipt className="text-primary-500" />;
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case "order":
        return "Shop Order";
      case "event":
        return "Event Fee";
      default:
        return "Payment";
    }
  };

  if (allPayments.length === 0) {
    return (
      <div className="text-center py-12 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-primary-600 mb-2">No payment history yet.</p>
        <p className="text-sm text-primary-500">Your payments and orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-900">
            ${stats.totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">
            ${stats.totalPending.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Shop Orders</p>
          <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white border-2 border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700 mb-1">Event Fees</p>
          <p className="text-2xl font-bold text-amber-900">{stats.totalEvents}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <IoFilter className="text-primary-600" />
        <span className="text-sm font-medium text-primary-700">Filter:</span>
        {["all", "paid", "pending", "rejected", "orders"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-900 text-white"
                : "bg-primary-100 text-primary-700 hover:bg-primary-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-primary-600">No payments found for this filter.</p>
          </div>
        ) : (
          filteredPayments.map((payment, index) => (
            <motion.div
              key={payment.id || index}
              className="bg-white border-2 border-primary-200 rounded-xl p-5 hover:border-tertiary-500 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-lg ${
                      payment.status === "paid"
                        ? "bg-green-100"
                        : payment.status === "rejected"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                    }`}
                  >
                    {payment.status === "paid" ? (
                      <IoCheckmarkCircle className="text-green-600 text-xl" />
                    ) : payment.status === "rejected" ? (
                      <IoTime className="text-red-600 text-xl" />
                    ) : (
                      <IoTime className="text-yellow-600 text-xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-secondary-600">
                        {payment.eventName || payment.description}
                      </h3>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {getPaymentTypeLabel(payment.type)}
                      </span>
                      {payment.orderNumber && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                          #{payment.orderNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-primary-600 flex-wrap">
                      <span>
                        {new Date(payment.paymentDate || payment.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {payment.transactionId && (
                        <span className="font-mono text-xs">
                          TXN: {payment.transactionId.slice(-8)}
                        </span>
                      )}
                      {payment.orderStatus && (
                        <span className="text-xs">
                          Status: {payment.orderStatus}
                        </span>
                      )}
                    </div>
                    {payment.type === "order" && payment.items && (
                      <div className="mt-2 text-xs text-primary-500">
                        {payment.items.length} item{payment.items.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary-950">
                    ${payment.amount?.toFixed(2) || "0.00"}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
