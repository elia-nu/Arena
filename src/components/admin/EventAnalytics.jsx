import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoCalendar,
  IoPeople,
  IoCash,
  IoStatsChart,
  IoTime,
  IoLocation,
  IoDownload,
  IoEye,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";
import { adminAPI, tournamentAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const EventAnalytics = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [analytics, setAnalytics] = useState({
    tournaments: [],
    totalRegistrations: 0,
    totalRevenue: 0,
    averageRegistrations: 0,
    completionRate: 0,
    topPerformingEvents: [],
    registrationTrends: [],
    revenueByEvent: [],
    statusBreakdown: {},
  });

  useEffect(() => {
    fetchEventAnalytics();
  }, [dateRange]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

  const fetchEventAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getEventAnalytics({
        days: parseInt(dateRange),
      });
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching event analytics:", error);
      showError("Failed to load event analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportEventData = async () => {
    try {
      const data = await adminAPI.exportReport("events", {
        days: parseInt(dateRange),
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event_analytics_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      showError("Failed to export event data");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
      registration_closed: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      draft: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.draft;
  };

  // Paginate top performing events
  const totalEvents = analytics.topPerformingEvents?.length || 0;
  const totalPages = Math.ceil(totalEvents / itemsPerPage);
  const paginatedEvents = analytics.topPerformingEvents?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-secondary-600">
              Event Analytics Dashboard
            </h2>
            <p className="text-sm text-primary-600 mt-1">
              Comprehensive analytics and insights for all tournaments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={exportEventData}
              className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
            >
              <IoDownload />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <IoCalendar className="text-3xl text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {analytics.tournaments?.length || 0}
              </span>
            </div>
            <p className="text-sm font-medium text-blue-800">Total Events</p>
            <p className="text-xs text-blue-600 mt-1">
              {analytics.statusBreakdown?.open || 0} active
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <IoPeople className="text-3xl text-green-600" />
              <span className="text-2xl font-bold text-green-900">
                {analytics.totalRegistrations || 0}
              </span>
            </div>
            <p className="text-sm font-medium text-green-800">
              Total Registrations
            </p>
            <p className="text-xs text-green-600 mt-1">
              Avg: {analytics.averageRegistrations?.toFixed(1) || 0} per event
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <IoCash className="text-3xl text-amber-600" />
              <span className="text-2xl font-bold text-amber-900">
                ${(analytics.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-medium text-amber-800">
              Total Revenue
            </p>
            <p className="text-xs text-amber-600 mt-1">From entry fees</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <IoStatsChart className="text-3xl text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">
                {(analytics.completionRate || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm font-medium text-purple-800">
              Completion Rate
            </p>
            <p className="text-xs text-purple-600 mt-1">Events completed</p>
          </motion.div>
        </div>
      </div>

      {/* Top Performing Events */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-secondary-600 mb-4">
          Top Performing Events
        </h3>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : paginatedEvents.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedEvents.map((event, index) => (
              <motion.div
                key={event._id || index}
                className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedTournament(event)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-tertiary-500 text-white rounded-full text-xs font-bold">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-primary-900">
                        {event.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-primary-600 text-xs">Registrations</p>
                        <p className="font-semibold text-primary-900">
                          {event.totalRegistrations || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Revenue</p>
                        <p className="font-semibold text-primary-900">
                          ${(event.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Teams</p>
                        <p className="font-semibold text-primary-900">
                          {event.teamRegistrations || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Players</p>
                        <p className="font-semibold text-primary-900">
                          {event.playerRegistrations || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <IoEye className="text-2xl text-primary-400 ml-4" />
                </div>
              </motion.div>
              ))}
            </div>
            {totalEvents > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalEvents}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-primary-600 py-8">
            No events found for the selected period
          </div>
        )}
      </div>

      {/* Registration Trends Chart */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-secondary-600 mb-4">
          Registration Trends
        </h3>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : analytics.registrationTrends?.length > 0 ? (
          <div className="relative h-64">
            {/* Chart Area */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
                  <stop offset="100%" stopColor="rgba(245, 158, 11, 0.05)" />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              ))}

              {/* Area Path */}
              <path
                d={(() => {
                  const maxRegistrations = Math.max(
                    1,
                    ...analytics.registrationTrends.map((t) => t.count || 0)
                  );
                  const points = analytics.registrationTrends.map((trend, index) => {
                    const x = (index / (analytics.registrationTrends.length - 1 || 1)) * 100;
                    const y = 100 - (trend.count / maxRegistrations) * 100;
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  });
                  return points.join(" ") + " L 100 100 L 0 100 Z";
                })()}
                fill="url(#areaGradient)"
                stroke="none"
              />
              
              {/* Line Path */}
              <path
                d={(() => {
                  const maxRegistrations = Math.max(
                    1,
                    ...analytics.registrationTrends.map((t) => t.count || 0)
                  );
                  const points = analytics.registrationTrends.map((trend, index) => {
                    const x = (index / (analytics.registrationTrends.length - 1 || 1)) * 100;
                    const y = 100 - (trend.count / maxRegistrations) * 100;
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  });
                  return points.join(" ");
                })()}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data Points */}
              {analytics.registrationTrends.map((trend, index) => {
                const maxRegistrations = Math.max(
                  1,
                  ...analytics.registrationTrends.map((t) => t.count || 0)
                );
                const x = (index / (analytics.registrationTrends.length - 1 || 1)) * 100;
                const y = 100 - (trend.count / maxRegistrations) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth="1"
                    className="hover:r-2 transition-all cursor-pointer"
                    title={`${new Date(trend.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}: ${trend.count} registration${trend.count !== 1 ? "s" : ""}`}
                  />
                );
              })}
            </svg>
            
            {/* X-axis Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 mt-2">
              {analytics.registrationTrends
                .filter((_, index) => {
                  // Show first, last, and evenly spaced labels
                  const total = analytics.registrationTrends.length;
                  if (total <= 7) return true;
                  const step = Math.ceil(total / 7);
                  return index === 0 || index === total - 1 || index % step === 0;
                })
                .map((trend, idx, filtered) => (
                  <span
                    key={idx}
                    className="text-xs text-primary-600"
                    style={{
                      transform: idx === 0 ? "translateX(0)" : idx === filtered.length - 1 ? "translateX(0)" : "translateX(-50%)",
                    }}
                  >
                    {new Date(trend.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ))}
            </div>
            
            {/* Y-axis Labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-primary-600 px-1">
              {(() => {
                const maxRegistrations = Math.max(
                  1,
                  ...analytics.registrationTrends.map((t) => t.count || 0)
                );
                return [maxRegistrations, Math.ceil(maxRegistrations * 0.75), Math.ceil(maxRegistrations * 0.5), Math.ceil(maxRegistrations * 0.25), 0].map((val, idx) => (
                  <span key={idx}>{val}</span>
                ));
              })()}
            </div>
          </div>
        ) : (
          <div className="text-center text-primary-600 py-8">
            <p className="mb-2">No registration data available</p>
            <p className="text-sm text-primary-500">
              Registration trends will appear here once tournaments have registrations.
            </p>
          </div>
        )}
      </div>

      {/* Event Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.statusBreakdown || {}).map(
              ([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        status
                      )}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="font-bold text-primary-900">{count}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Revenue by Event
          </h3>
          {analytics.revenueByEvent?.length > 0 ? (
            <div className="space-y-3">
              {analytics.revenueByEvent
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-primary-900 text-sm">
                        {event.name}
                      </p>
                      <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-tertiary-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (event.revenue /
                                Math.max(
                                  ...analytics.revenueByEvent.map(
                                    (e) => e.revenue
                                  )
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-bold text-primary-900 ml-4">
                      ${(event.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-primary-600 py-8 text-sm">
              No revenue data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;

