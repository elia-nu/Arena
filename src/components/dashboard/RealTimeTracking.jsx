import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCalendar,
  IoTime,
  IoLocation,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoAlertCircle,
  IoNotifications,
  IoTrophy,
  IoPeople,
} from "react-icons/io5";
import { tournamentAPI, matchAPI, notificationAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const RealTimeTracking = ({ user, teamData, isTeamLeader = false }) => {
  const { showSuccess, showError } = useNotification();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchTrackingData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000);

    // Check for reminders every minute
    const reminderInterval = setInterval(() => {
      checkReminders();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(reminderInterval);
    };
  }, [user, teamData, isTeamLeader]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const userId = user?._id || user?.id;
      const teamId = teamData?._id || teamData?.id;
      const userIdString = userId?.toString();
      const teamIdString = teamId?.toString();

      const getIdString = (value) => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          return (value._id || value.id || null)?.toString?.() || null;
        }
        return null;
      };

      // Fetch matches and tournaments
      const [matchesResponse, tournamentsResponse] = await Promise.all([
        matchAPI.getAll({ limit: 100 }),
        tournamentAPI.getAll({ limit: 100 }),
      ]);

      const allMatches = matchesResponse.matches || [];
      const allTournaments = tournamentsResponse.tournaments || [];

      // Filter matches for this user/team
      const myMatches = allMatches.filter((match) => {
        if (isTeamLeader && teamId) {
          const team1Id =
            match.team1?.team?._id?.toString() ||
            match.team1?.team?.id?.toString() ||
            (typeof match.team1?.team === "string"
              ? match.team1.team
              : null);
          const team2Id =
            match.team2?.team?._id?.toString() ||
            match.team2?.team?.id?.toString() ||
            (typeof match.team2?.team === "string"
              ? match.team2.team
              : null);
          return (
            (team1Id && team1Id === teamId.toString()) ||
            (team2Id && team2Id === teamId.toString())
          );
        } else {
          const p1Id =
            match.team1?.player?._id?.toString() ||
            match.team1?.player?.id?.toString() ||
            (typeof match.team1?.player === "string"
              ? match.team1.player
              : null);
          const p2Id =
            match.team2?.player?._id?.toString() ||
            match.team2?.player?.id?.toString() ||
            (typeof match.team2?.player === "string"
              ? match.team2.player
              : null);
          return (
            (p1Id && p1Id === userId.toString()) ||
            (p2Id && p2Id === userId.toString())
          );
        }
      });

      // Filter tournaments for this user/team
      let myTournaments = [];
      if (isTeamLeader && teamIdString) {
        myTournaments = allTournaments
          .filter((tournament) => {
            return (tournament.registeredTeams || []).some((reg) => {
              const regTeam = getIdString(reg.team);
              return regTeam && regTeam.toString() === teamIdString;
            });
          })
          .map((tournament) => ({
            ...tournament,
            registrationSource: "team",
          }));
      } else {
        const tournamentMap = new Map();

        // Individual registrations
        allTournaments.forEach((tournament) => {
          const isIndividuallyRegistered = (tournament.registeredPlayers || []).some(
            (reg) => {
              const playerId = getIdString(reg.player);
              return playerId && playerId.toString() === userIdString;
            }
          );

          if (isIndividuallyRegistered) {
            const id = tournament._id || tournament.id;
            tournamentMap.set(id, {
              ...tournament,
              registrationSource: "individual",
            });
          }
        });

        // Team registrations for players who belong to a team
        if (teamIdString) {
          allTournaments.forEach((tournament) => {
            const isTeamRegistered = (tournament.registeredTeams || []).some(
              (reg) => {
                const regTeam = getIdString(reg.team);
                return regTeam && regTeam.toString() === teamIdString;
              }
            );

            if (isTeamRegistered) {
              const id = tournament._id || tournament.id;
              tournamentMap.set(id, {
                ...tournament,
                registrationSource: "team",
              });
            }
          });
        }

        myTournaments = Array.from(tournamentMap.values());
      }

      // Get upcoming matches (within next 7 days)
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = myMatches
        .filter((match) => {
          const matchDate = new Date(match.scheduledDate);
          return (
            matchDate >= now &&
            matchDate <= sevenDaysFromNow &&
            match.status !== "completed" &&
            match.status !== "cancelled"
          );
        })
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

      // Get upcoming tournaments (within next 30 days)
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const upcomingTours = myTournaments
        .filter((tournament) => {
          const tourDate = new Date(tournament.startDate);
          return (
            tourDate >= now &&
            tourDate <= thirtyDaysFromNow &&
            tournament.status !== "completed" &&
            tournament.status !== "cancelled"
          );
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      // Get recent results (completed in last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = myMatches
        .filter((match) => {
          const matchDate = new Date(match.scheduledDate);
          return (
            match.status === "completed" &&
            match.result &&
            matchDate >= sevenDaysAgo
          );
        })
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
        .slice(0, 5);

      setUpcomingMatches(upcoming);
      setUpcomingTournaments(upcomingTours);
      setRecentResults(recent);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkReminders = async () => {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Check for matches starting in 1 hour
      const matchesStartingSoon = upcomingMatches.filter((match) => {
        const matchDate = new Date(match.scheduledDate);
        return matchDate >= now && matchDate <= oneHourFromNow;
      });

      // Check for tournaments starting in 1 day
      const tournamentsStartingSoon = upcomingTournaments.filter((tournament) => {
        const tourDate = new Date(tournament.startDate);
        return tourDate >= now && tourDate <= oneDayFromNow;
      });

      // Show reminders
      if (matchesStartingSoon.length > 0) {
        matchesStartingSoon.forEach((match) => {
          const opponentName = isTeamLeader
            ? match.team1?.team?._id?.toString() ===
              (teamData?._id || teamData?.id)?.toString()
              ? match.team2?.team?.name || "Opponent"
              : match.team1?.team?.name || "Opponent"
            : match.team1?.player?._id?.toString() ===
              (user?._id || user?.id)?.toString()
            ? match.team2?.player?.username || "Opponent"
            : match.team1?.player?.username || "Opponent";

          showSuccess(
            `Reminder: Match vs ${opponentName} starts in less than 1 hour!`
          );
        });
      }

      if (tournamentsStartingSoon.length > 0) {
        tournamentsStartingSoon.forEach((tournament) => {
          showSuccess(
            `Reminder: Tournament "${tournament.name}" starts in less than 24 hours!`
          );
        });
      }
    } catch (error) {
      console.error("Error checking reminders:", error);
    }
  };

  const getTimeUntil = (date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;

    if (diff < 0) return "Past";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800",
      live: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      open: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      registration_closed: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">
            Real-Time Tracking
          </h2>
          <p className="text-sm text-primary-600 mt-1">
            Live updates for matches and tournaments
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary-600">
          <IoNotifications className="text-primary-400" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Upcoming Matches */}
      <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <IoTime className="text-tertiary-600" />
            Upcoming Matches
          </h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {upcomingMatches.length}
          </span>
        </div>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : upcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {upcomingMatches.map((match, index) => {
              const team1Name =
                match.team1?.team?.name ||
                match.team1?.player?.username ||
                "TBD";
              const team2Name =
                match.team2?.team?.name ||
                match.team2?.player?.username ||
                "TBD";
              const timeUntil = getTimeUntil(match.scheduledDate);
              const isStartingSoon = timeUntil.includes("m") && !timeUntil.includes("h");

              return (
                <motion.div
                  key={match._id || index}
                  className={`border-2 rounded-lg p-4 ${
                    isStartingSoon
                      ? "border-red-300 bg-red-50"
                      : "border-primary-200 bg-primary-50"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-primary-900">
                          {team1Name} vs {team2Name}
                        </h4>
                        {isStartingSoon && (
                          <IoAlertCircle className="text-red-500 animate-pulse" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-primary-600">
                          <IoCalendar className="text-primary-400" />
                          <span>
                            {new Date(match.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        {match.scheduledTime && (
                          <div className="flex items-center gap-1 text-primary-600">
                            <IoTime className="text-primary-400" />
                            <span>{match.scheduledTime}</span>
                          </div>
                        )}
                        {match.location && (
                          <div className="flex items-center gap-1 text-primary-600">
                            <IoLocation className="text-primary-400" />
                            <span className="truncate">{match.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-primary-600">
                          <IoTime className="text-primary-400" />
                          <span className="font-semibold text-primary-900">
                            {timeUntil}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${getStatusColor(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-primary-600 py-8">
            No upcoming matches
          </div>
        )}
      </div>

      {/* Upcoming Tournaments */}
      <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
            <IoCalendar className="text-tertiary-600" />
            Upcoming Tournaments
          </h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            {upcomingTournaments.length}
          </span>
        </div>
        {loading ? (
          <div className="text-center text-primary-600 py-8">Loading...</div>
        ) : upcomingTournaments.length > 0 ? (
          <div className="space-y-3">
            {upcomingTournaments.map((tournament, index) => {
              const timeUntil = getTimeUntil(tournament.startDate);
              const isStartingSoon = timeUntil.includes("h") || timeUntil.includes("m");

              return (
                <motion.div
                  key={tournament._id || index}
                  className={`border-2 rounded-lg p-4 ${
                    isStartingSoon
                      ? "border-amber-300 bg-amber-50"
                      : "border-primary-200 bg-primary-50"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-primary-900">
                          {tournament.name}
                        </h4>
                        {tournament.registrationSource && (
                          <span className="px-2 py-0.5 bg-secondary-50 text-secondary-700 rounded text-xs font-semibold">
                            {tournament.registrationSource === "team"
                              ? "Team Registered"
                              : "Individual Registered"}
                          </span>
                        )}
                        {isStartingSoon && (
                          <IoAlertCircle className="text-amber-500 animate-pulse" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-primary-600">
                          <IoCalendar className="text-primary-400" />
                          <span>
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        {tournament.location && (
                          <div className="flex items-center gap-1 text-primary-600">
                            <IoLocation className="text-primary-400" />
                            <span className="truncate">{tournament.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-primary-600">
                          <IoPeople className="text-primary-400" />
                          <span>
                            {((tournament.registeredTeams || []).length +
                              (tournament.registeredPlayers || []).length) || 0}{" "}
                            registered
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-primary-600">
                          <IoTime className="text-primary-400" />
                          <span className="font-semibold text-primary-900">
                            {timeUntil}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${getStatusColor(
                        tournament.status
                      )}`}
                    >
                      {tournament.status?.replace("_", " ")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-primary-600 py-8">
            No upcoming tournaments
          </div>
        )}
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <IoTrophy className="text-tertiary-600" />
              Recent Results
            </h3>
          </div>
          <div className="space-y-3">
            {recentResults.map((match, index) => {
              const team1Name =
                match.team1?.team?.name ||
                match.team1?.player?.username ||
                "TBD";
              const team2Name =
                match.team2?.team?.name ||
                match.team2?.player?.username ||
                "TBD";
              const isMyTeam = isTeamLeader
                ? (match.team1?.team?._id?.toString() ===
                    (teamData?._id || teamData?.id)?.toString() ||
                    match.team2?.team?._id?.toString() ===
                      (teamData?._id || teamData?.id)?.toString())
                : (match.team1?.player?._id?.toString() ===
                    (user?._id || user?.id)?.toString() ||
                    match.team2?.player?._id?.toString() ===
                      (user?._id || user?.id)?.toString());
              const isWin =
                match.result?.winner?.toString() ===
                (isTeamLeader
                  ? (teamData?._id || teamData?.id)?.toString()
                  : (user?._id || user?.id)?.toString());

              return (
                <motion.div
                  key={match._id || index}
                  className={`border-2 rounded-lg p-4 ${
                    isWin
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isWin ? (
                          <IoCheckmarkCircle className="text-green-600" />
                        ) : (
                          <IoCloseCircle className="text-red-600" />
                        )}
                        <h4 className="font-bold text-primary-900">
                          {team1Name} vs {team2Name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary-900">
                            {match.result?.score?.team1Score || 0}
                          </span>
                          <span className="text-primary-600">-</span>
                          <span className="font-semibold text-primary-900">
                            {match.result?.score?.team2Score || 0}
                          </span>
                        </div>
                        <span className="text-primary-600">
                          {new Date(match.scheduledDate).toLocaleDateString()}
                        </span>
                        {match.tournament && (
                          <span className="text-primary-600">
                            {match.tournament.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${
                        isWin
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isWin ? "Win" : "Loss"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeTracking;

