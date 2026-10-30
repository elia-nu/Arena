import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { shopAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { FaCheckCircle, FaTimesCircle, FaEye, FaSpinner } from "react-icons/fa";

const ZellePaymentsManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [filter, setFilter] = useState("pending"); // pending, verified, rejected, all
  const [typeFilter, setTypeFilter] = useState("all"); // all, orders, tournaments
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orders, setOrders] = useState([]);
  const [tournamentPayments, setTournamentPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, [filter, currentPage, typeFilter]);

  const fetchPayments = async () => {
    // Always build the combined list from the freshly fetched data
    // instead of relying on possibly stale state inside this function.
    let fetchedOrders = [];
    let fetchedTournamentPayments = [];

    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
      };

      // Fetch orders if needed
      if (typeFilter === "all" || typeFilter === "orders") {
        if (filter === "pending") {
          const data = await shopAPI.getPendingZellePayments(params);
          fetchedOrders = data.orders || [];
        } else {
          const queryParams = {
            ...params,
          };
          
          if (filter === "verified") {
            queryParams.paymentStatus = "paid";
          } else if (filter === "rejected") {
            queryParams.paymentStatus = "failed";
          }
          
          const data = await shopAPI.getAdminOrders(queryParams);
          fetchedOrders = (data.orders || []).filter((order) =>
            ["zelle", "cash_app"].includes(order.paymentMethod)
          );
        }
      } else {
        fetchedOrders = [];
      }

      // Fetch tournament payments if needed
      if (typeFilter === "all" || typeFilter === "tournaments") {
        if (filter === "pending") {
          const data = await shopAPI.getPendingZelleTournamentPayments(params);
          fetchedTournamentPayments = data.payments || [];
        } else if (filter === "verified") {
          // Fetch verified tournament payments
          const queryParams = {
            ...params,
            paymentStatus: "paid",
          };
          const data = await shopAPI.getAllZelleTournamentPayments(queryParams);
          fetchedTournamentPayments = data.payments || [];
        } else if (filter === "rejected") {
          // Tournament registrations currently do not support a rejected status
          fetchedTournamentPayments = [];
        } else {
          // Fetch all tournament payments
          const queryParams = {
            ...params,
            paymentStatus: "all",
          };
          const data = await shopAPI.getAllZelleTournamentPayments(queryParams);
          fetchedTournamentPayments = data.payments || [];
        }
      } else {
        fetchedTournamentPayments = [];
      }

      // Update state from freshly fetched data
      setOrders(fetchedOrders);
      setTournamentPayments(fetchedTournamentPayments);

      // Combine and set total pages based on the latest data
      const allPayments = [...fetchedOrders, ...fetchedTournamentPayments];
      setPayments(allPayments);
      setTotalPages(Math.max(
        fetchedOrders.length > 0 ? Math.ceil(fetchedOrders.length / 20) : 1,
        fetchedTournamentPayments.length > 0 ? Math.ceil(fetchedTournamentPayments.length / 20) : 1
      ));
    } catch (error) {
      console.error("Error fetching manual payments:", error);
      showError("Failed to load manual payments");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId, notes = "", paymentType = "order") => {
    try {
      setVerifying(paymentId);
      
      if (paymentType === "tournament") {
        const payment = tournamentPayments.find(p => p.registrationId === paymentId);
        if (!payment) {
          throw new Error("Tournament payment not found");
        }
        await shopAPI.verifyZelleTournamentPayment(
          payment.tournamentId,
          payment.registrationId,
          notes,
          payment.registrationType
        );
        showSuccess("Tournament payment verified successfully! Registration has been confirmed.");
      } else {
        await shopAPI.verifyZellePayment(paymentId, notes);
        showSuccess("Payment verified successfully! Order has been confirmed.");
      }
      
      setSelectedPayment(null);
      setVerificationNotes("");
      fetchPayments(); // Refresh the list
    } catch (error) {
      console.error("Error verifying payment:", error);
      showError(error.message || "Failed to verify payment");
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectPayment = async (orderId, reason) => {
    if (!window.confirm(`Are you sure you want to reject this payment? Reason: ${reason || "No reason provided"}`)) {
      return;
    }

    try {
      setVerifying(orderId);
      // Update order status to cancelled
      await shopAPI.updateAdminOrder(orderId, {
        status: "cancelled",
        paymentStatus: "failed",
        notes: `Payment rejected: ${reason || "No reason provided"}`,
      });
      showSuccess("Payment rejected. Order has been cancelled.");
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      showError(error.message || "Failed to reject payment");
    } finally {
      setVerifying(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      confirmed: "bg-blue-100 text-blue-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h2 className="text-3xl font-bold text-secondary-600 mb-2">
          Manual Payments Management
        </h2>
        <p className="text-primary-700">
          Review and verify Zelle and Cash App payments. Verify payments to confirm orders and update stock.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-primary-800 mb-2">Payment Status</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFilter("pending");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setFilter("verified");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "verified"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => {
                setFilter("rejected");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "rejected"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Manual Payments
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary-800 mb-2">Payment Type</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTypeFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                typeFilter === "all"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setTypeFilter("orders");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                typeFilter === "orders"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Shop Orders Only
            </button>
            <button
              onClick={() => {
                setTypeFilter("tournaments");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                typeFilter === "tournaments"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Events Only
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin w-8 h-8 text-primary-900" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-12 text-center">
          <p className="text-primary-700 text-lg">
            No {filter === "pending" ? "pending" : ""} manual payments found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Render Orders */}
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-primary-200 rounded-3xl p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Order Info */}
                <div>
                  <h3 className="font-bold text-lg text-primary-950 mb-2">
                    Order #{order.orderNumber}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-primary-600">Customer:</span>{" "}
                      <span className="font-semibold">
                        {order.user?.firstName || order.user?.username || "N/A"}
                        {order.user?.lastName && ` ${order.user.lastName}`}
                      </span>
                    </p>
                    <p>
                      <span className="text-primary-600">Email:</span>{" "}
                      {order.user?.email || "N/A"}
                    </p>
                    <p>
                      <span className="text-primary-600">Date:</span>{" "}
                      {formatDate(order.createdAt)}
                    </p>
                    <p>
                      <span className="text-primary-600">Status:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </p>
                    <p>
                      <span className="text-primary-600">Payment Status:</span>{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h4 className="font-semibold text-primary-950 mb-2">
                    {order.paymentMethod === "cash_app"
                      ? "Cash App Payment Details"
                      : "Zelle Payment Details"}
                  </h4>
                  <div className="space-y-1 text-sm">
                    {order.zellePayment?.sendersName && (
                      <p>
                        <span className="text-primary-600">Sender:</span>{" "}
                        <span className="font-semibold">
                          {order.zellePayment.sendersName}
                        </span>
                      </p>
                    )}
                    {order.zellePayment?.email && (
                      <p>
                        <span className="text-primary-600">Email:</span>{" "}
                        {order.zellePayment.email}
                      </p>
                    )}
                    {order.zellePayment?.amount && (
                      <p>
                        <span className="text-primary-600">Amount:</span>{" "}
                        <span className="font-bold text-green-600">
                          ${order.zellePayment.amount.toFixed(2)}
                        </span>
                      </p>
                    )}
                    {order.zellePayment?.transactionReference && (
                      <p>
                        <span className="text-primary-600">Reference:</span>{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {order.zellePayment.transactionReference}
                        </code>
                      </p>
                    )}
                    {order.zellePayment?.verifiedAt && (
                      <p>
                        <span className="text-primary-600">Verified:</span>{" "}
                        {formatDate(order.zellePayment.verifiedAt)}
                      </p>
                    )}
                    {order.zellePayment?.verifiedBy && (
                      <p>
                        <span className="text-primary-600">Verified By:</span>{" "}
                        Admin
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h4 className="font-semibold text-primary-950 mb-2">
                    Order Summary
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-primary-600">Items:</span>{" "}
                      {order.items?.length || 0}
                    </p>
                    <p>
                      <span className="text-primary-600">Subtotal:</span>{" "}
                      ${order.subtotal?.toFixed(2) || "0.00"}
                    </p>
                    {order.discount > 0 && (
                      <p>
                        <span className="text-primary-600">Discount:</span>{" "}
                        -${order.discount.toFixed(2)}
                      </p>
                    )}
                    <p>
                      <span className="text-primary-600">Tax:</span>{" "}
                      ${order.tax?.toFixed(2) || "0.00"}
                    </p>
                    <p className="font-bold text-lg text-tertiary-600">
                      Total: ${order.total?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-4 border-t border-primary-200 pt-4">
                  <h4 className="font-semibold text-primary-950 mb-2">
                    Order Items:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-primary-600">
                            Qty: {item.quantity} × ${item.price?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {order.paymentStatus === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-primary-200">
                  <button
                    onClick={() => setSelectedPayment(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaEye />
                    View Details
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(order._id, "", "order")}
                    disabled={verifying === order._id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {verifying === order._id ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Verify Payment
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) {
                        handleRejectPayment(order._id, reason);
                      }
                    }}
                    disabled={verifying === order._id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <FaTimesCircle />
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {/* Render Tournament Payments */}
          {tournamentPayments.map((payment) => (
            <motion.div
              key={payment.registrationId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-blue-200 rounded-3xl p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-primary-950 mb-2">
                    Event Registration
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-primary-600">Tournament:</span>{" "}
                      <span className="font-semibold">{payment.tournamentName}</span>
                    </p>
                    <p>
                      <span className="text-primary-600">Date:</span>{" "}
                      {formatDate(payment.tournamentDate)}
                    </p>
                    <p>
                      <span className="text-primary-600">Type:</span>{" "}
                      <span className="font-semibold capitalize">{payment.registrationType}</span>
                    </p>
                    {payment.teamName && (
                      <p>
                        <span className="text-primary-600">Team:</span>{" "}
                        <span className="font-semibold">{payment.teamName}</span>
                      </p>
                    )}
                    {payment.playerName && (
                      <p>
                        <span className="text-primary-600">Player:</span>{" "}
                        <span className="font-semibold">{payment.playerName}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-primary-600">Status:</span>{" "}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-950 mb-2">
                    {payment.paymentMethod === "cash_app"
                      ? "Cash App Payment Details"
                      : "Zelle Payment Details"}
                  </h4>
                  <div className="space-y-1 text-sm">
                    {payment.zellePayment?.sendersName && (
                      <p>
                        <span className="text-primary-600">Sender:</span>{" "}
                        <span className="font-semibold">{payment.zellePayment.sendersName}</span>
                      </p>
                    )}
                    {payment.zellePayment?.email && (
                      <p>
                        <span className="text-primary-600">Email:</span>{" "}
                        {payment.zellePayment.email}
                      </p>
                    )}
                    {payment.zellePayment?.amount && (
                      <p>
                        <span className="text-primary-600">Amount:</span>{" "}
                        <span className="font-bold text-green-600">
                          ${payment.zellePayment.amount.toFixed(2)}
                        </span>
                      </p>
                    )}
                    {payment.zellePayment?.transactionReference && (
                      <p>
                        <span className="text-primary-600">Reference:</span>{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {payment.zellePayment.transactionReference}
                        </code>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-950 mb-2">
                    Registration Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-primary-600">Registered:</span>{" "}
                      {formatDate(payment.registeredAt)}
                    </p>
                    {payment.zellePayment?.verifiedAt && (
                      <p>
                        <span className="text-primary-600">Verified:</span>{" "}
                        {formatDate(payment.zellePayment.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {payment.paymentStatus === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-primary-200">
                  <button
                    onClick={() => setSelectedPayment({ ...payment, type: "tournament" })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaEye />
                    View Details
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(payment.registrationId, "", "tournament")}
                    disabled={verifying === payment.registrationId}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {verifying === payment.registrationId ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Verify Payment
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-primary-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-primary-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-primary-950">
                  {selectedPayment.type === "tournament" 
                    ? `Payment Details - ${selectedPayment.tournamentName}`
                    : `Payment Details - Order #${selectedPayment.orderNumber}`}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-primary-400 hover:text-primary-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary-800 mb-1">
                      Sender's Name
                    </label>
                    <p className="text-primary-950">
                      {selectedPayment.zellePayment?.sendersName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-800 mb-1">
                      Email
                    </label>
                    <p className="text-primary-950">
                      {selectedPayment.zellePayment?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-800 mb-1">
                      Amount Paid
                    </label>
                    <p className="text-primary-950 font-bold text-lg">
                      ${selectedPayment.zellePayment?.amount?.toFixed(2) || selectedPayment.total?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-800 mb-1">
                      Order Total
                    </label>
                    <p className="text-primary-950 font-bold text-lg">
                      ${selectedPayment.total?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  {selectedPayment.zellePayment?.transactionReference && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-primary-800 mb-1">
                        Transaction Reference
                      </label>
                      <p className="text-primary-950 font-mono bg-gray-100 p-2 rounded">
                        {selectedPayment.zellePayment.transactionReference}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Verification Notes (Optional)
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any notes about this verification..."
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      const paymentId = selectedPayment.type === "tournament" 
                        ? selectedPayment.registrationId 
                        : selectedPayment._id;
                      handleVerifyPayment(
                        paymentId,
                        verificationNotes,
                        selectedPayment.type === "tournament" ? "tournament" : "order"
                      );
                    }}
                    disabled={verifying === (selectedPayment._id || selectedPayment.registrationId)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {verifying === (selectedPayment._id || selectedPayment.registrationId) ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        {selectedPayment.type === "tournament" 
                          ? "Verify & Confirm Registration"
                          : "Verify & Confirm Order"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZellePaymentsManagement;

