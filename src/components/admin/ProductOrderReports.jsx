import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoCart,
  IoCash,
  IoStatsChart,
  IoCheckmarkCircle,
  IoTime,
  IoCloseCircle,
  IoDownload,
  IoBag,
  IoShirt,
  IoWatch,
  IoFootball,
  IoTrendingUp,
  IoTrendingDown,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const ProductOrderReports = () => {
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [analytics, setAnalytics] = useState({
    products: {
      total: 0,
      active: 0,
      inactive: 0,
      lowStock: 0,
      outOfStock: 0,
      categoryBreakdown: {},
      topSelling: [],
    },
    orders: {
      total: 0,
      paid: 0,
      pending: 0,
      cancelled: 0,
      statusBreakdown: {},
      paymentMethodBreakdown: {},
      totalRevenue: 0,
      averageOrderValue: 0,
      salesTrends: [],
    },
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getProductOrderAnalytics({
        days: dateRange === "all" ? "all" : parseInt(dateRange),
      });
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching product and order analytics:", error);
      showError("Failed to load product and order analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      const csvRows = [];
      
      // Product Report
      csvRows.push("PRODUCT REPORT");
      csvRows.push(`Total Products,${analytics.products.total}`);
      csvRows.push(`Active Products,${analytics.products.active}`);
      csvRows.push(`Inactive Products,${analytics.products.inactive}`);
      csvRows.push(`Low Stock Products,${analytics.products.lowStock}`);
      csvRows.push(`Out of Stock Products,${analytics.products.outOfStock}`);
      csvRows.push("");
      csvRows.push("Top Selling Products");
      csvRows.push("Product Name,Category,Quantity Sold,Revenue");
      analytics.products.topSelling.forEach((p) => {
        csvRows.push(`"${p.productName}",${p.category},${p.quantitySold},$${p.revenue.toFixed(2)}`);
      });
      
      csvRows.push("");
      csvRows.push("ORDER REPORT");
      csvRows.push(`Total Orders,${analytics.orders.total}`);
      csvRows.push(`Paid Orders,${analytics.orders.paid}`);
      csvRows.push(`Pending Orders,${analytics.orders.pending}`);
      csvRows.push(`Cancelled Orders,${analytics.orders.cancelled}`);
      csvRows.push(`Total Revenue,$${analytics.orders.totalRevenue.toFixed(2)}`);
      csvRows.push(`Average Order Value,$${analytics.orders.averageOrderValue.toFixed(2)}`);
      
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `product_order_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      showError("Failed to export report");
    }
  };

  // Chart dimensions for sales trends
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 30;

  const trendData = analytics.orders.salesTrends || [];
  const maxRevenue = Math.max(1, ...trendData.map((d) => d.revenue));

  // Calculate points for revenue line
  const revenuePoints = trendData
    .map((d, i) => {
      const x = (i / (trendData.length - 1 || 1)) * (chartWidth - 2 * padding) + padding;
      const y =
        chartHeight - (d.revenue / maxRevenue) * (chartHeight - 2 * padding) - padding;
      return `${x},${y}`;
    })
    .join(" ");

  // Area path for revenue
  const revenueAreaPath =
    trendData.length > 0
      ? `${padding},${chartHeight - padding} ${revenuePoints} ${
          chartWidth - padding
        },${chartHeight - padding}`
      : "";

  const getCategoryIcon = (category) => {
    switch (category) {
      case "apparel":
        return <IoShirt className="text-blue-500" />;
      case "accessories":
        return <IoWatch className="text-purple-500" />;
      case "equipment":
        return <IoFootball className="text-green-500" />;
      default:
        return <IoBag className="text-primary-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold text-primary-900">
          Product & Order Reports
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg text-sm bg-white"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <IoDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Product Statistics */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h2 className="text-2xl font-bold text-secondary-600 mb-6">
          Product Statistics
        </h2>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Product Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.div
                className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-sm text-primary-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-primary-950">
                  {analytics.products.total}
                </p>
              </motion.div>
              <motion.div
                className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm text-green-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.products.active}
                </p>
              </motion.div>
              <motion.div
                className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-gray-600 mb-1">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.products.inactive}
                </p>
              </motion.div>
              <motion.div
                className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-yellow-600 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {analytics.products.lowStock}
                </p>
              </motion.div>
              <motion.div
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-red-600 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900">
                  {analytics.products.outOfStock}
                </p>
              </motion.div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.products.categoryBreakdown || {}).map(
                    ([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-primary-200"
                      >
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <span className="font-medium text-primary-800 capitalize">
                            {category}
                          </span>
                        </div>
                        <span className="text-primary-950 font-semibold">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Top Selling Products
                </h3>
                {analytics.products.topSelling.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.products.topSelling.slice(0, 5).map((product, index) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded-lg border border-primary-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(product.category)}
                            <span className="font-medium text-primary-800">
                              {product.productName}
                            </span>
                          </div>
                          <span className="text-green-600 font-bold">
                            ${product.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-primary-600">
                          {product.quantitySold} units sold
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-primary-600 py-4">
                    No sales data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Statistics */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h2 className="text-2xl font-bold text-secondary-600 mb-6">
          Order Statistics
        </h2>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-sm text-primary-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-primary-950">
                  {analytics.orders.total}
                </p>
              </motion.div>
              <motion.div
                className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-sm text-green-600 mb-1">Paid Orders</p>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.orders.paid}
                </p>
              </motion.div>
              <motion.div
                className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-yellow-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {analytics.orders.pending}
                </p>
              </motion.div>
              <motion.div
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-red-600 mb-1">Cancelled Orders</p>
                <p className="text-2xl font-bold text-red-900">
                  {analytics.orders.cancelled}
                </p>
              </motion.div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-900">
                      ${analytics.orders.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <IoCash className="text-4xl text-green-600" />
                </div>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">
                      Average Order Value
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      ${analytics.orders.averageOrderValue.toFixed(2)}
                    </p>
                  </div>
                  <IoStatsChart className="text-4xl text-blue-600" />
                </div>
              </motion.div>
            </div>

            {/* Sales Trends Chart */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                Sales Revenue Trends
              </h3>
              {trendData.length > 0 ? (
                <div className="relative" style={{ width: "100%", height: chartHeight }}>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full"
                  >
                    {/* Grid Lines */}
                    {[0, 0.5, 1].map((ratio, i) => (
                      <g key={i}>
                        <line
                          x1={padding}
                          y1={chartHeight - padding - ratio * (chartHeight - 2 * padding)}
                          x2={chartWidth - padding}
                          y2={chartHeight - padding - ratio * (chartHeight - 2 * padding)}
                          stroke="#e0e0e0"
                          strokeDasharray="2 2"
                          strokeWidth="1"
                        />
                        <text
                          x={padding - 5}
                          y={chartHeight - padding - ratio * (chartHeight - 2 * padding) + 5}
                          textAnchor="end"
                          className="text-xs fill-primary-600"
                        >
                          ${(maxRevenue * ratio).toFixed(0)}
                        </text>
                      </g>
                    ))}

                    {/* Area */}
                    <motion.path
                      d={`M${revenueAreaPath} Z`}
                      fill="url(#revenueGradient)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8 }}
                    />

                    {/* Line */}
                    <motion.path
                      d={`M${revenuePoints}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Data Points */}
                    {trendData.map((d, i) => {
                      const x =
                        (i / (trendData.length - 1 || 1)) * (chartWidth - 2 * padding) +
                        padding;
                      const y =
                        chartHeight -
                        (d.revenue / maxRevenue) * (chartHeight - 2 * padding) -
                        padding;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10b981"
                          stroke="#fff"
                          strokeWidth="2"
                          className="cursor-pointer hover:scale-125 transition-transform"
                        >
                          <title>
                            {`${new Date(d.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}: $${d.revenue.toFixed(2)}`}
                          </title>
                        </circle>
                      );
                    })}

                    {/* X-axis labels */}
                    {trendData.length > 0 && (
                      <>
                        <text
                          x={padding}
                          y={chartHeight - padding + 15}
                          textAnchor="middle"
                          className="text-xs fill-primary-600"
                        >
                          {new Date(trendData[0].date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </text>
                        {trendData.length > 1 && (
                          <text
                            x={chartWidth - padding}
                            y={chartHeight - padding + 15}
                            textAnchor="middle"
                            className="text-xs fill-primary-600"
                          >
                            {new Date(
                              trendData[trendData.length - 1].date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </text>
                        )}
                      </>
                    )}

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : (
                <div className="text-center text-primary-600 py-8">
                  No sales data available for the selected period.
                </div>
              )}
            </div>

            {/* Order Status & Payment Method Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Order Status Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(analytics.orders.statusBreakdown || {}).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-primary-200"
                      >
                        <span className="font-medium text-primary-800 capitalize">
                          {status}
                        </span>
                        <span className="text-primary-950 font-semibold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Payment Method Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(analytics.orders.paymentMethodBreakdown || {}).map(
                    ([method, count]) => (
                      <div
                        key={method}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-primary-200"
                      >
                        <span className="font-medium text-primary-800 capitalize">
                          {method || "Other"}
                        </span>
                        <span className="text-primary-950 font-semibold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrderReports;

