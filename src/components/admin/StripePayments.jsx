import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoCash,
  IoTrophy,
  IoCart,
  IoFilter,
  IoCalendar,
  IoDownload,
  IoCheckmarkCircle,
  IoTime,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const StripePayments = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    tournamentRevenue: 0,
    orderRevenue: 0,
    totalCount: 0,
    tournamentCount: 0,
    orderCount: 0,
  });
  const [filter, setFilter] = useState("all"); // all, tournament, order
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90, all
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [filter, dateRange, currentPage, itemsPerPage]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        type: filter, // Send "all" explicitly
        page: currentPage,
        limit: itemsPerPage,
      };

      if (dateRange !== "all") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const data = await adminAPI.getStripePayments(params);
      console.log("Stripe payments response:", data);
      setPayments(data.payments || []);
      setSummary(data.summary || {
        totalRevenue: 0,
        tournamentRevenue: 0,
        orderRevenue: 0,
        totalCount: 0,
        tournamentCount: 0,
        orderCount: 0,
      });
      setPagination(data.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
      });
    } catch (error) {
      console.error("Error fetching Stripe payments:", error);
      showError(error.message || "Failed to load Stripe payments");
    } finally {
      setLoading(false);
    }
  };

  const exportPayments = () => {
    const csv = [
      ["Type", "Date", "Payer", "Amount", "Status", "Details"].join(","),
      ...payments.map((p) =>
        [
          p.type === "tournament" ? "Tournament" : "Order",
          new Date(p.date || p.createdAt).toLocaleDateString(),
          p.payerName || "Unknown",
          `$${p.amount?.toFixed(2) || "0.00"}`,
          p.paymentStatus || "paid",
          p.type === "tournament"
            ? p.tournamentName
            : `Order #${p.orderNumber}`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stripe_payments_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPaymentTypeIcon = (type) => {
    return type === "tournament" ? (
      <IoTrophy className="text-amber-500" />
    ) : (
      <IoCart className="text-blue-500" />
    );
  };

  const getPaymentTypeColor = (type) => {
    return type === "tournament"
      ? "bg-amber-100 text-amber-800"
      : "bg-blue-100 text-blue-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">
            Stripe Payments
          </h2>
          <p className="text-sm text-primary-600 mt-1">
            View all tournament and product sales payments processed through Stripe
          </p>
        </div>
        <button
          onClick={exportPayments}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
        >
          <IoDownload />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IoCash className="text-green-500 text-2xl" />
            <div>
              <p className="text-sm text-primary-600">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-900">
                ${summary.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-500">
            {summary.totalCount} total payments
          </p>
        </div>

        <div className="bg-white border-2 border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IoTrophy className="text-amber-500 text-2xl" />
            <div>
              <p className="text-sm text-primary-600">Tournament Revenue</p>
              <p className="text-2xl font-bold text-amber-900">
                ${summary.tournamentRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-500">
            {summary.tournamentCount} tournament payments
          </p>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IoCart className="text-blue-500 text-2xl" />
            <div>
              <p className="text-sm text-primary-600">Product Sales</p>
              <p className="text-2xl font-bold text-blue-900">
                ${summary.orderRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-500">
            {summary.orderCount} orders
          </p>
        </div>

        <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IoCheckmarkCircle className="text-green-500 text-2xl" />
            <div>
              <p className="text-sm text-primary-600">Success Rate</p>
              <p className="text-2xl font-bold text-primary-900">100%</p>
            </div>
          </div>
          <p className="text-xs text-primary-500">All paid via Stripe</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <IoFilter className="text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Type:</span>
            {["all", "tournament", "order"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setCurrentPage(1);
                }}
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

          <div className="flex items-center gap-2">
            <IoCalendar className="text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Period:</span>
            {["7", "30", "90", "all"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDateRange(d);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateRange === d
                    ? "bg-primary-900 text-white"
                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                }`}
              >
                {d === "all" ? "All Time" : `Last ${d} days`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-primary-600">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-primary-600 mb-2">No payments found</p>
          <p className="text-sm text-primary-500 mb-4">
            {filter === "all"
              ? "No Stripe payments found for tournaments or product sales."
              : filter === "tournament"
              ? "No tournament entry fee payments found."
              : "No product order payments found."}
          </p>
          <p className="text-xs text-primary-400">
            Payments will appear here once transactions are processed through Stripe.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <motion.div
              key={payment._id}
              className="bg-white border-2 border-primary-200 rounded-lg p-5 hover:border-primary-300 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${getPaymentTypeColor(payment.type)}`}>
                    {getPaymentTypeIcon(payment.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-primary-900">
                        {payment.type === "tournament"
                          ? payment.tournamentName
                          : `Order #${payment.orderNumber}`}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentTypeColor(payment.type)}`}
                      >
                        {payment.type === "tournament" ? "Tournament" : "Shop Order"}
                      </span>
                      {payment.payerType && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                          {payment.payerType === "team" ? "Team" : "Individual"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-primary-600">
                      <p>
                        <span className="font-medium">Payer:</span> {payment.payerName}
                        {payment.payerEmail && (
                          <span className="ml-2 text-primary-500">
                            ({payment.payerEmail})
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(payment.date || payment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      {payment.type === "order" && (
                        <div>
                          <p>
                            <span className="font-medium">Items:</span> {payment.itemCount}
                            {payment.items && payment.items.length > 0 && (
                              <span className="ml-2 text-primary-500">
                                ({payment.items.map((i) => i.name || i.product?.name).join(", ")})
                              </span>
                            )}
                          </p>
                          {payment.paymentIntentId && (
                            <p className="text-xs font-mono text-primary-500">
                              Payment Intent: {payment.paymentIntentId.slice(-12)}
                            </p>
                          )}
                        </div>
                      )}
                      {payment.type === "tournament" && (
                        <p className="text-xs text-primary-500">
                          Tournament Entry Fee
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-900 mb-2">
                    ${payment.amount?.toFixed(2) || "0.00"}
                  </p>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {payment.paymentStatus || "paid"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && payments.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages || 1}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemsPerPage={itemsPerPage}
            totalItems={pagination.total || payments.length}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StripePayments;

