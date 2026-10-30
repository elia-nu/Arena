import { useState } from "react";
import { motion } from "framer-motion";
import {
  IoStatsChart,
  IoDownload,
  IoCalendar,
  IoCash,
  IoTrophy,
  IoPeople,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";
import { useNotification } from "../NotificationProvider";

const TeamReporting = ({
  reports = [],
  myTournaments = [],
  myMatches = [],
  stats = {},
  teamData = null,
}) => {
  const { showSuccess, showError } = useNotification();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Helper function to get payment status from tournament's registeredTeams array
  const getPaymentStatus = (tournament, teamId) => {
    if (!tournament || !teamId) return "pending";

    const teamIdString = teamId.toString();
    const registration = tournament.registeredTeams?.find((reg) => {
      const regTeam =
        reg.team?._id ||
        reg.team?.id ||
        (typeof reg.team === "string" ? reg.team : null);
      return regTeam && regTeam.toString() === teamIdString;
    });

    return registration?.paymentStatus || "pending";
  };

  // Calculate real statistics
  const completedMatches = myMatches.filter((m) => m.status === "completed");
  const totalMatches = myMatches.length;
  const wins = completedMatches.filter((match) => {
    if (!match.result || !match.result.winner) return false;
    const team1Id =
      match.team1?.team?._id?.toString() ||
      match.team1?.team?.id?.toString() ||
      (typeof match.team1?.team === "string" ? match.team1.team : null);
    const team2Id =
      match.team2?.team?._id?.toString() ||
      match.team2?.team?.id?.toString() ||
      (typeof match.team2?.team === "string" ? match.team2.team : null);
    const winnerId = match.result.winner.toString();
    const teamId = teamData?._id?.toString() || teamData?.id?.toString();
    return (
      (team1Id && team1Id === teamId && winnerId === team1Id) ||
      (team2Id && team2Id === teamId && winnerId === team2Id)
    );
  }).length;

  const winRate =
    completedMatches.length > 0
      ? Math.round((wins / completedMatches.length) * 100)
      : 0;

  const totalEvents = myTournaments.length;
  const teamId = teamData?._id?.toString() || teamData?.id?.toString();
  
  const totalRevenue = myTournaments.reduce((sum, t) => {
    const entryFee = t.entryFee || 0;
    const paymentStatus = getPaymentStatus(t, teamId);
    return paymentStatus === "paid" ? sum + entryFee : sum;
  }, 0);

  const pendingPayments = myTournaments.filter(
    (t) => t.entryFee > 0 && getPaymentStatus(t, teamId) === "pending"
  ).length;

  const generateReport = (reportType) => {
    let data = {};

    switch (reportType) {
      case "performance":
        data = {
          type: "performance",
          teamName: teamData?.name || "N/A",
          generatedAt: new Date().toISOString(),
          statistics: {
            totalMatches: totalMatches,
            completedMatches: completedMatches.length,
            wins: wins,
            losses: completedMatches.length - wins,
            winRate: `${winRate}%`,
            draws: completedMatches.filter(
              (m) => m.result && !m.result.winner
            ).length,
          },
          matches: completedMatches.map((match) => {
            const team1Name =
              match.team1?.team?.name ||
              match.team1?.player?.username ||
              "TBD";
            const team2Name =
              match.team2?.team?.name ||
              match.team2?.player?.username ||
              "TBD";
            const isWin =
              match.result?.winner?.toString() ===
              (teamData?._id?.toString() || teamData?.id?.toString());
            return {
              date: match.scheduledDate,
              opponent: team1Name.includes(teamData?.name)
                ? team2Name
                : team1Name,
              result: isWin ? "Win" : "Loss",
              score: match.result?.score
                ? `${match.result.score.team1Score} - ${match.result.score.team2Score}`
                : "N/A",
            };
          }),
        };
        break;

      case "events":
        data = {
          type: "events",
          teamName: teamData?.name || "N/A",
          generatedAt: new Date().toISOString(),
          statistics: {
            totalEvents: totalEvents,
            upcomingEvents: myTournaments.filter(
              (t) => new Date(t.startDate) > new Date()
            ).length,
            completedEvents: myTournaments.filter(
              (t) => t.status === "completed"
            ).length,
            totalRevenue: totalRevenue,
            pendingPayments: pendingPayments,
          },
          tournaments: myTournaments.map((tournament) => {
            const paymentStatus = getPaymentStatus(tournament, teamId);
            return {
              name: tournament.name,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
              location: tournament.location,
              status: tournament.status,
              entryFee: tournament.entryFee || 0,
              paymentStatus: paymentStatus,
              registeredAt: tournament.registeredAt,
            };
          }),
        };
        break;

      case "financial":
        data = {
          type: "financial",
          teamName: teamData?.name || "N/A",
          generatedAt: new Date().toISOString(),
          statistics: {
            totalSpent: `$${totalRevenue.toLocaleString()}`,
            totalEvents: totalEvents,
            paidEvents: myTournaments.filter(
              (t) => getPaymentStatus(t, teamId) === "paid"
            ).length,
            pendingPayments: pendingPayments,
            averageEventCost:
              totalEvents > 0
                ? `$${(totalRevenue / totalEvents).toFixed(2)}`
                : "$0.00",
          },
          transactions: myTournaments
            .filter((t) => t.entryFee > 0)
            .map((tournament) => {
              const paymentStatus = getPaymentStatus(tournament, teamId);
              return {
                tournamentName: tournament.name,
                amount: tournament.entryFee,
                status: paymentStatus,
                date: tournament.registeredAt || tournament.createdAt,
              };
            }),
        };
        break;

      default:
        showError("Unknown report type");
        return;
    }

    setSelectedReport(reportType);
    setReportData(data);
    showSuccess(`${reportType} report generated successfully`);
  };

  const handleExport = (reportType) => {
    if (!reportData || selectedReport !== reportType) {
      generateReport(reportType);
      setTimeout(() => {
        exportToFile(reportType);
      }, 500);
      return;
    }
    exportToFile(reportType);
  };

  const exportToFile = (reportType) => {
    const dataToExport = reportData || {};
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${teamData?.name || "team"}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Matches Played",
            value: totalMatches,
            icon: <IoStatsChart />,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Win Rate",
            value: `${winRate}%`,
            icon: <IoTrophy />,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Events",
            value: totalEvents,
            icon: <IoCalendar />,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white border-2 border-primary-200 rounded-xl p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`${stat.color} text-2xl mb-2 flex justify-center`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-primary-950">{stat.value}</p>
            <p className="text-sm text-primary-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Reports List */}
      <div>
        <h3 className="text-xl font-bold text-secondary-600 mb-4">
          Available Reports
        </h3>
        <div className="space-y-3">
          {[
            {
              id: 1,
              name: "Team Performance Report",
              description: "Overall team statistics and performance metrics",
              type: "performance",
            },
            {
              id: 2,
              name: "Event Participation Report",
              description: "Detailed breakdown of team event participation",
              type: "events",
            },
            {
              id: 3,
              name: "Financial Report",
              description: "Payment and revenue tracking for the team",
              type: "financial",
            },
          ].map((report, index) => (
            <motion.div
              key={report.id}
              className="bg-white border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-secondary-600">
                    {report.name}
                  </h4>
                  <p className="text-sm text-primary-600 mt-1">
                    {report.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateReport(report.type)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    <IoStatsChart />
                    View
                  </button>
                  <button
                    onClick={() => handleExport(report.type)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    <IoDownload />
                    Export
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Report Preview */}
      {selectedReport && reportData && (
        <motion.div
          className="bg-white border-2 border-primary-200 rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-secondary-600">
              {reportData.type === "performance"
                ? "Team Performance Report"
                : reportData.type === "events"
                ? "Event Participation Report"
                : "Financial Report"}
            </h3>
            <button
              onClick={() => handleExport(selectedReport)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
            >
              <IoDownload />
              Export
            </button>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(reportData.statistics || {}).map(([key, value]) => (
              <div
                key={key}
                className="bg-primary-50 border border-primary-200 rounded-lg p-4"
              >
                <p className="text-xs text-primary-600 mb-1">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-lg font-bold text-primary-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Report Details */}
          {reportData.type === "performance" && reportData.matches && (
            <div>
              <h4 className="text-lg font-semibold text-primary-900 mb-4">
                Match History
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Opponent
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Result
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.matches.map((match, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-primary-50"}
                      >
                        <td className="px-4 py-2 text-primary-800">
                          {new Date(match.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-primary-800">
                          {match.opponent}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              match.result === "Win"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {match.result}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-primary-800">
                          {match.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.type === "events" && reportData.tournaments && (
            <div>
              <h4 className="text-lg font-semibold text-primary-900 mb-4">
                Tournament Participation
              </h4>
              <div className="space-y-3">
                {reportData.tournaments.map((tournament, index) => (
                  <div
                    key={index}
                    className="bg-primary-50 border border-primary-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-primary-900">
                        {tournament.name}
                      </h5>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          tournament.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tournament.paymentStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-primary-600 text-xs">Start Date</p>
                        <p className="font-medium text-primary-900">
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Location</p>
                        <p className="font-medium text-primary-900">
                          {tournament.location || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Entry Fee</p>
                        <p className="font-medium text-primary-900">
                          ${tournament.entryFee}
                        </p>
                      </div>
                      <div>
                        <p className="text-primary-600 text-xs">Status</p>
                        <p className="font-medium text-primary-900 capitalize">
                          {tournament.status?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportData.type === "financial" && reportData.transactions && (
            <div>
              <h4 className="text-lg font-semibold text-primary-900 mb-4">
                Financial Transactions
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Tournament
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-primary-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.map((transaction, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-primary-50"}
                      >
                        <td className="px-4 py-2 text-primary-800">
                          {transaction.tournamentName}
                        </td>
                        <td className="px-4 py-2 font-semibold text-primary-900">
                          ${transaction.amount}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              transaction.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-primary-800">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Recent Reports
          </h3>
          <div className="space-y-3">
            {reports.map((report, index) => (
              <motion.div
                key={report.id || index}
                className="bg-white border-2 border-primary-200 rounded-xl p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-950">
                      {report.name}
                    </p>
                    <p className="text-sm text-primary-600">
                      Generated: {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleExport(report.type)}
                    className="p-2 text-tertiary-600 hover:bg-tertiary-100 rounded-lg transition-colors"
                  >
                    <IoDownload />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamReporting;
