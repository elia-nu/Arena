import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoDownload,
  IoDocumentText,
  IoCalendar,
  IoPeople,
  IoCash,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const Reports = () => {
  const { showError, showSuccess } = useNotification();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  // Currently selected report for preview/export
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [selectedReportData, setSelectedReportData] = useState(null);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);

  useEffect(() => {
    fetchReports();
  }, [reportType, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReports({
        type: reportType,
        days: parseInt(dateRange),
      });
      setReports(data.reports || []);
    } catch (error) {
      showError(error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const buildPreviewTable = (type, data) => {
    let columns = [];
    let rows = [];

    if (type === "users" && Array.isArray(data.users)) {
      columns = [
        "username",
        "email",
        "memberCode",
        "firstName",
        "lastName",
        "role",
        "isActive",
        "createdAt",
      ];
      rows = data.users.map((u) => ({
        username: u.username,
        email: u.email,
        memberCode: u.memberCode || "",
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive ? "Yes" : "No",
        createdAt: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString()
          : "",
      }));
    } else if (type === "events" && Array.isArray(data.events)) {
      columns = [
        "name",
        "startDate",
        "endDate",
        "location",
        "registeredTeams",
        "registeredPlayers",
        "totalRegistrations",
      ];
      rows = data.events.map((e) => ({
        name: e.name,
        startDate: e.startDate
          ? new Date(e.startDate).toLocaleDateString()
          : "",
        endDate: e.endDate ? new Date(e.endDate).toLocaleDateString() : "",
        location: e.location || "",
        registeredTeams: (e.registeredTeams || []).length,
        registeredPlayers: (e.registeredPlayers || []).length,
        totalRegistrations:
          (e.registeredTeams || []).length +
          (e.registeredPlayers || []).length,
      }));
    } else if (type === "revenue" && Array.isArray(data.transactions)) {
      columns = ["date", "amount", "description"];
      rows = data.transactions.map((t) => ({
        date: t.date ? new Date(t.date).toLocaleDateString() : "",
        amount: t.amount,
        description: t.description || "",
      }));
    } else if (type === "activity" && Array.isArray(data.activities)) {
      columns = ["date", "action", "count"];
      rows = data.activities.map((a) => ({
        date: a.date ? new Date(a.date).toLocaleDateString() : "",
        action: a.action || "",
        count: a.count || 0,
      }));
    } else {
      // Fallback: try to infer columns from first row of any array on data
      const arrayKey = Object.keys(data || {}).find(
        (k) => Array.isArray(data[k]) && data[k].length > 0
      );
      if (arrayKey) {
        const first = data[arrayKey][0];
        columns = Object.keys(first || {});
        rows = data[arrayKey];
      } else {
        columns = [];
        rows = [];
      }
    }

    setPreviewColumns(columns);
    setPreviewRows(rows);
  };

  const loadReportForPreview = async (type) => {
    try {
      setLoading(true);
      const data = await adminAPI.generateReport(type, {
        days: parseInt(dateRange),
      });

      setSelectedReportType(type);
      setSelectedReportData(data);
      buildPreviewTable(type, data);

      showSuccess(`${type} report loaded for preview`);
    } catch (error) {
      showError(error.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportCurrentReportToExcel = () => {
    if (!selectedReportType || !previewColumns.length || !previewRows.length) {
      showError("No report loaded to export");
      return;
    }

    const header = previewColumns.join(",");
    const csvRows = previewRows.map((row) =>
      previewColumns
        .map((col) => {
          const value = row[col] != null ? String(row[col]) : "";
          // Escape quotes and commas
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    );

    const csvContent = [header, ...csvRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReportType}_report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess("Report exported as Excel-compatible CSV");
  };

  const reportTypes = [
    {
      id: "users",
      label: "User Report",
      icon: IoPeople,
      description: "User registrations, activity, and demographics",
    },
    {
      id: "events",
      label: "Event Report",
      icon: IoCalendar,
      description: "Event registrations, attendance, and revenue",
    },
    {
      id: "revenue",
      label: "Revenue Report",
      icon: IoCash,
      description: "Financial transactions and revenue breakdown",
    },
    {
      id: "activity",
      label: "Activity Report",
      icon: IoDocumentText,
      description: "User activity logs and engagement metrics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-secondary-600">Reports</h2>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            >
              <option value="all">All Reports</option>
              <option value="users">User Reports</option>
              <option value="events">Event Reports</option>
              <option value="revenue">Revenue Reports</option>
              <option value="activity">Activity Reports</option>
            </select>
          </div>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <motion.div
              key={type.id}
              className="bg-white border-2 border-primary-200 rounded-xl p-6 hover:border-tertiary-500 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => loadReportForPreview(type.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <type.icon className="text-3xl text-tertiary-600" />
                <IoDownload className="text-xl text-primary-600" />
              </div>
              <h3 className="font-bold text-secondary-600 mb-2">{type.label}</h3>
              <p className="text-sm text-primary-600">{type.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-secondary-600 mb-4">
          Recent Reports
        </h3>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report, index) => (
              <motion.div
                key={index}
                className="bg-white border-2 border-primary-200 rounded-xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-950">
                      {report.name}
                    </p>
                    <p className="text-sm text-primary-600">
                      Generated on {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => loadReportForPreview(report.type)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    <IoDownload />
                    Load
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-primary-600 py-8">
            No reports available. Generate a report to get started.
          </div>
        )}
      </div>

      {/* Report Preview & Excel Export */}
      {selectedReportType && (
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-secondary-600">
                {selectedReportType.charAt(0).toUpperCase() +
                  selectedReportType.slice(1)}{" "}
                Report Preview
              </h3>
              <p className="text-sm text-primary-600">
                Showing first {Math.min(previewRows.length, 25)} of{" "}
                {previewRows.length} rows (
                {dateRange === "7"
                  ? "Last 7 days"
                  : dateRange === "30"
                  ? "Last 30 days"
                  : dateRange === "90"
                  ? "Last 90 days"
                  : "Last year"}
                )
              </p>
            </div>
            <button
              onClick={exportCurrentReportToExcel}
              disabled={!previewRows.length}
              className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoDownload />
              Export to Excel (CSV)
            </button>
          </div>

          {previewColumns.length === 0 || previewRows.length === 0 ? (
            <div className="text-center text-primary-600 py-8">
              No data available for this report.
            </div>
          ) : (
            <div className="overflow-x-auto border border-primary-100 rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-primary-50">
                  <tr>
                    {previewColumns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-semibold text-primary-700 border-b border-primary-100"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 25).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={
                        rowIndex % 2 === 0 ? "bg-white" : "bg-primary-50/50"
                      }
                    >
                      {previewColumns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-2 text-primary-800 border-b border-primary-50"
                        >
                          {row[col] != null ? String(row[col]) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
