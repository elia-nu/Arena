import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  IoPeople,
  IoCash,
  IoCalendar,
  IoStatsChart,
  IoTrendingUp,
  IoTrendingDown,
  IoDownload,
  IoRefresh,
  IoTime,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoPulse,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const RealTimeMonitoring = () => {
  const { showError, showSuccess } = useNotification();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const intervalRef = useRef(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMetrics();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const data = await adminAPI.getRealtimeMonitoring();
      setMetrics(data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching real-time metrics:", error);
      showError("Failed to load real-time metrics");
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!metrics) {
      showError("No data to export");
      return;
    }

    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        metrics: {
          traffic: metrics.traffic,
          sales: metrics.sales,
          registrations: metrics.registrations,
          engagement: metrics.engagement,
        },
      };

      const csvRows = [];
      csvRows.push("Real-Time Monitoring Report");
      csvRows.push(`Generated: ${new Date().toLocaleString()}`);
      csvRows.push("");

      // Traffic Metrics
      csvRows.push("TRAFFIC METRICS");
      csvRows.push(`Active Users Today,${metrics.traffic.activeUsersToday}`);
      csvRows.push(`New Users Today,${metrics.traffic.newUsersToday}`);
      csvRows.push(`New Users Yesterday,${metrics.traffic.newUsersYesterday}`);
      csvRows.push(`New Users (Last 7 Days),${metrics.traffic.newUsersLast7Days}`);
      csvRows.push(`New Users (Last 30 Days),${metrics.traffic.newUsersLast30Days}`);
      csvRows.push(`User Growth Rate,${metrics.traffic.userGrowthRate.toFixed(2)}%`);
      csvRows.push("");

      // Sales Metrics
      csvRows.push("SALES METRICS");
      csvRows.push(`Orders Today,${metrics.sales.ordersToday}`);
      csvRows.push(`Orders Yesterday,${metrics.sales.ordersYesterday}`);
      csvRows.push(`Sales Today,$${metrics.sales.salesToday.toFixed(2)}`);
      csvRows.push(`Sales Yesterday,$${metrics.sales.salesYesterday.toFixed(2)}`);
      csvRows.push(`Sales (Last 7 Days),$${metrics.sales.salesLast7Days.toFixed(2)}`);
      csvRows.push(`Sales (Last 30 Days),$${metrics.sales.salesLast30Days.toFixed(2)}`);
      csvRows.push(`Sales Growth Rate,${metrics.sales.salesGrowthRate.toFixed(2)}%`);
      csvRows.push(`Tournament Revenue Today,$${metrics.sales.tournamentRevenueToday.toFixed(2)}`);
      csvRows.push(`Tournament Revenue (Last 7 Days),$${metrics.sales.tournamentRevenueLast7Days.toFixed(2)}`);
      csvRows.push(`Tournament Revenue (Last 30 Days),$${metrics.sales.tournamentRevenueLast30Days.toFixed(2)}`);
      csvRows.push(`Total Revenue Today,$${metrics.sales.totalRevenue.toFixed(2)}`);
      csvRows.push("");

      // Registration Metrics
      csvRows.push("REGISTRATION METRICS");
      csvRows.push(`Registrations Today,${metrics.registrations.today}`);
      csvRows.push(`Registrations (Last 7 Days),${metrics.registrations.last7Days}`);
      csvRows.push(`Registrations (Last 30 Days),${metrics.registrations.last30Days}`);
      csvRows.push(`Recent Registrations (Last Hour),${metrics.registrations.recentHour}`);
      csvRows.push("");

      // Engagement Metrics
      csvRows.push("ENGAGEMENT METRICS");
      csvRows.push(`Total Orders,${metrics.engagement.totalOrders}`);
      csvRows.push(`Pending Orders,${metrics.engagement.pendingOrders}`);
      csvRows.push(`Active Tournaments,${metrics.engagement.activeTournaments}`);
      csvRows.push(`Total Teams,${metrics.engagement.totalTeams}`);
      csvRows.push(`Active Teams,${metrics.engagement.activeTeams}`);
      csvRows.push(`Recent Orders (Last Hour),${metrics.engagement.recentOrders}`);
      csvRows.push(`Recent Registrations (Last Hour),${metrics.engagement.recentRegistrations}`);
      csvRows.push(`Conversion Rate,${metrics.engagement.conversionRate.toFixed(2)}%`);

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `realtime_monitoring_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      showError("Failed to export report");
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading && !metrics) {
    return (
      <div className="text-center py-12 text-primary-600">Loading real-time metrics...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary-900 flex items-center gap-3">
            Real-Time Monitoring
            {autoRefresh && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-red-500"
              >
                <IoPulse />
              </motion.div>
            )}
          </h1>
          {lastUpdate && (
            <p className="text-sm text-primary-600 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-primary-700">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-tertiary-600 border-primary-300 rounded focus:ring-tertiary-500"
            />
          </div>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="px-3 py-1 border border-primary-300 rounded-lg text-sm bg-white"
            >
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1min</option>
              <option value="300">5min</option>
            </select>
          )}
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <IoRefresh /> Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <IoDownload /> Export Report
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Traffic Metrics */}
          <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-secondary-600 mb-6 flex items-center gap-2">
              <IoPeople className="text-blue-500" /> Traffic Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                label="Active Users Today"
                value={metrics.traffic.activeUsersToday}
                icon={<IoPeople />}
                color="blue"
              />
              <MetricCard
                label="New Users Today"
                value={metrics.traffic.newUsersToday}
                icon={<IoPeople />}
                color="green"
                trend={
                  metrics.traffic.newUsersYesterday > 0
                    ? ((metrics.traffic.newUsersToday - metrics.traffic.newUsersYesterday) /
                        metrics.traffic.newUsersYesterday) *
                      100
                    : metrics.traffic.newUsersToday > 0
                    ? 100
                    : 0
                }
              />
              <MetricCard
                label="New Users (7 Days)"
                value={metrics.traffic.newUsersLast7Days}
                icon={<IoPeople />}
                color="purple"
              />
              <MetricCard
                label="New Users (30 Days)"
                value={metrics.traffic.newUsersLast30Days}
                icon={<IoPeople />}
                color="indigo"
              />
              <MetricCard
                label="Growth Rate"
                value={`${metrics.traffic.userGrowthRate.toFixed(1)}%`}
                icon={<IoStatsChart />}
                color={metrics.traffic.userGrowthRate >= 0 ? "green" : "red"}
                trend={metrics.traffic.userGrowthRate}
              />
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-secondary-600 mb-6 flex items-center gap-2">
              <IoCash className="text-green-500" /> Sales Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <MetricCard
                label="Sales Today"
                value={formatCurrency(metrics.sales.salesToday)}
                icon={<IoCash />}
                color="green"
                trend={metrics.sales.salesGrowthRate}
              />
              <MetricCard
                label="Orders Today"
                value={metrics.sales.ordersToday}
                icon={<IoCash />}
                color="blue"
              />
              <MetricCard
                label="Sales (7 Days)"
                value={formatCurrency(metrics.sales.salesLast7Days)}
                icon={<IoCash />}
                color="purple"
              />
              <MetricCard
                label="Sales (30 Days)"
                value={formatCurrency(metrics.sales.salesLast30Days)}
                icon={<IoCash />}
                color="indigo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Tournament Revenue Today"
                value={formatCurrency(metrics.sales.tournamentRevenueToday)}
                icon={<IoCalendar />}
                color="orange"
              />
              <MetricCard
                label="Tournament Revenue (7 Days)"
                value={formatCurrency(metrics.sales.tournamentRevenueLast7Days)}
                icon={<IoCalendar />}
                color="amber"
              />
              <MetricCard
                label="Total Revenue Today"
                value={formatCurrency(metrics.sales.totalRevenue)}
                icon={<IoCash />}
                color="green"
                highlight
              />
            </div>
          </div>

          {/* Registration Metrics */}
          <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-secondary-600 mb-6 flex items-center gap-2">
              <IoCalendar className="text-purple-500" /> Registration Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Registrations Today"
                value={metrics.registrations.today}
                icon={<IoCalendar />}
                color="purple"
              />
              <MetricCard
                label="Registrations (7 Days)"
                value={metrics.registrations.last7Days}
                icon={<IoCalendar />}
                color="blue"
              />
              <MetricCard
                label="Registrations (30 Days)"
                value={metrics.registrations.last30Days}
                icon={<IoCalendar />}
                color="indigo"
              />
              <MetricCard
                label="Recent (Last Hour)"
                value={metrics.registrations.recentHour}
                icon={<IoTime />}
                color="green"
                highlight={metrics.registrations.recentHour > 0}
              />
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-secondary-600 mb-6 flex items-center gap-2">
              <IoStatsChart className="text-orange-500" /> Engagement Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Orders"
                value={metrics.engagement.totalOrders}
                icon={<IoCash />}
                color="blue"
              />
              <MetricCard
                label="Pending Orders"
                value={metrics.engagement.pendingOrders}
                icon={<IoTime />}
                color="yellow"
              />
              <MetricCard
                label="Active Tournaments"
                value={metrics.engagement.activeTournaments}
                icon={<IoCalendar />}
                color="green"
              />
              <MetricCard
                label="Active Teams"
                value={metrics.engagement.activeTeams}
                icon={<IoPeople />}
                color="purple"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <MetricCard
                label="Recent Orders (Last Hour)"
                value={metrics.engagement.recentOrders}
                icon={<IoTime />}
                color="blue"
                highlight={metrics.engagement.recentOrders > 0}
              />
              <MetricCard
                label="Recent Registrations (Last Hour)"
                value={metrics.engagement.recentRegistrations}
                icon={<IoTime />}
                color="green"
                highlight={metrics.engagement.recentRegistrations > 0}
              />
              <MetricCard
                label="Conversion Rate"
                value={`${metrics.engagement.conversionRate.toFixed(2)}%`}
                icon={<IoStatsChart />}
                color="indigo"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, icon, color, trend, highlight }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
    red: "bg-red-50 border-red-200 text-red-600",
  };

  const borderClass = highlight
    ? "border-4 border-tertiary-500"
    : "border-2 border-primary-200";

  return (
    <motion.div
      className={`bg-white ${borderClass} rounded-xl p-4 ${highlight ? "shadow-lg" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <IoTrendingUp className="text-green-500" />
            ) : (
              <IoTrendingDown className="text-red-500" />
            )}
            <span
              className={`text-xs font-semibold ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-sm text-primary-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary-950">{value}</p>
    </motion.div>
  );
};

export default RealTimeMonitoring;

