import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoTrendingUp,
  IoPeople,
  IoCalendar,
  IoCash,
  IoDownload,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";

const AnalyticsPanel = ({ dateRange: propDateRange }) => {
  const [internalDateRange, setInternalDateRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});
  const dateRange = propDateRange !== undefined ? propDateRange : internalDateRange;
  const setDateRange = setInternalDateRange;

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAnalytics({ days: parseInt(dateRange) });
      setAnalytics(data || {});
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics({});
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    try {
      const data = await adminAPI.exportReport(type, {
        days: parseInt(dateRange),
      });
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Date Range Selector */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Analytics & Insights
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-700"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={() => exportReport("full")}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <IoDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "New Users",
              value: analytics.userGrowth?.length || 0,
              icon: IoPeople,
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100",
              borderColor: "border-blue-200",
              iconColor: "text-blue-600",
              textColor: "text-blue-900"
            },
            {
              label: "Event Registrations",
              value: analytics.eventRegistrations?.length || 0,
              icon: IoCalendar,
              gradient: "from-teal-500 to-teal-600",
              bgGradient: "from-teal-50 to-teal-100",
              borderColor: "border-teal-200",
              iconColor: "text-teal-600",
              textColor: "text-teal-900"
            },
            {
              label: "Total Revenue",
              value: `$${
                analytics.revenue
                  ?.reduce((sum, r) => sum + (r.amount || 0), 0)
                  .toLocaleString() || "0"
              }`,
              icon: IoCash,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-green-50 to-green-100",
              borderColor: "border-green-200",
              iconColor: "text-green-600",
              textColor: "text-green-900"
            },
            {
              label: "Growth Rate",
              value: "+12.5%",
              icon: IoTrendingUp,
              gradient: "from-purple-500 to-purple-600",
              bgGradient: "from-purple-50 to-purple-100",
              borderColor: "border-purple-200",
              iconColor: "text-purple-600",
              textColor: "text-purple-900"
            },
          ].map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <motion.div
                key={metric.label}
                className={`bg-gradient-to-br ${metric.bgGradient} border-2 ${metric.borderColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-all`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium ${metric.textColor} opacity-80`}>{metric.label}</p>
                  <div className={`bg-gradient-to-br ${metric.gradient} p-2 rounded-lg shadow-md`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${metric.textColor}`}>
                  {metric.value}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth Chart */}
        <motion.div
          className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            User Growth
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {loading ? (
              <div className="w-full text-center text-gray-600">
                Loading...
              </div>
            ) : analytics.userGrowth?.length > 0 ? (
              analytics.userGrowth.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t transition-all hover:from-blue-700 hover:to-blue-600 shadow-sm"
                    style={{
                      height: `${
                        (data.count /
                          Math.max(
                            ...analytics.userGrowth.map((d) => d.count)
                          )) *
                        100
                      }%`,
                    }}
                    title={`${data.date}: ${data.count} users`}
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {new Date(data.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-gray-600 py-12">
                No data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {loading ? (
              <div className="w-full text-center text-gray-600">
                Loading...
              </div>
            ) : analytics.revenue?.length > 0 ? (
              analytics.revenue.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-500 rounded-t transition-all hover:from-green-700 hover:to-green-600 shadow-sm"
                    style={{
                      height: `${
                        (data.amount /
                          Math.max(...analytics.revenue.map((d) => d.amount))) *
                        100
                      }%`,
                    }}
                    title={`${data.date}: $${data.amount}`}
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {new Date(data.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-gray-600 py-12">
                No data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Events */}
        <motion.div
          className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top Events</h3>
            <button
              onClick={() => exportReport("events")}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
            >
              Export
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-gray-600 py-8 text-sm">
                Loading...
              </div>
            ) : analytics.topEvents?.length > 0 ? (
              analytics.topEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-3 hover:from-purple-100 hover:to-purple-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {event.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {event.registrations} registrations
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-sm">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-8 text-sm">
                No events data
              </div>
            )}
          </div>
        </motion.div>

        {/* User Activity */}
        <motion.div
          className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              User Activity
            </h3>
            <button
              onClick={() => exportReport("activity")}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold"
            >
              Export
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-gray-600 py-8 text-sm">
                Loading...
              </div>
            ) : analytics.userActivity?.length > 0 ? (
              analytics.userActivity.map((activity, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-200 rounded-lg p-3 hover:from-teal-100 hover:to-teal-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {activity.count} occurrences
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {activity.date}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-8 text-sm">
                No activity data
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
