import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  IoClose,
  IoCalendar,
  IoLocation,
  IoPeople,
  IoCash,
  IoTrophy,
  IoInformationCircle,
} from "react-icons/io5";
import {
  teamAPI,
  tournamentAPI,
  matchAPI,
  paymentAPI,
  nonprofitAPI,
  announcementAPI,
} from "../services/api";
import { useNotification } from "../components/NotificationProvider";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/dashboard/ui/StatCard";
import SectionHeader from "../components/dashboard/ui/SectionHeader";
import EmptyState from "../components/dashboard/ui/EmptyState";
import { StatCardSkeleton, ListItemSkeleton } from "../components/dashboard/ui/SkeletonLoader";
import {
  IoGridOutline,
  IoCalendarOutline,
  IoFootballOutline,
  IoBagOutline,
  IoHandLeftOutline,
  IoShirtOutline,
  IoChatbubblesOutline,
  IoBarChartOutline,
  IoWarningOutline,
  IoPeopleOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import RosterManagement from "../components/dashboard/RosterManagement";
import TeamCommunication from "../components/dashboard/TeamCommunication";
import TeamReporting from "../components/dashboard/TeamReporting";
import RealTimeTracking from "../components/dashboard/RealTimeTracking";
import MyOrders from "../components/dashboard/MyOrders";
import MyNonProfitActivities from "../components/dashboard/MyNonProfitActivities";
import ManagementAnnouncements from "../components/dashboard/ManagementAnnouncements";

const TeamLeaderDashboard = () => {
  const { user, isTeamLeader, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [activeTab, setActiveTab] = useState("overview");
  const [teamData, setTeamData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [managementAnnouncements, setManagementAnnouncements] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [nonProfitActivities, setNonProfitActivities] = useState([]);
  const [stats, setStats] = useState({
    teamSize: 0,
    eventsRegistered: 0,
    upcomingEvents: 0,
    totalWins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);

  // Helper function to get payment status and registration from tournament's registeredTeams array
  const getRegistrationInfo = (tournament, teamId) => {
    if (!tournament || !teamId) {
      return { paymentStatus: "pending", registrationId: null };
    }

    const teamIdString = teamId.toString();
    const registration = tournament.registeredTeams?.find((reg) => {
      const regTeam =
        reg.team?._id ||
        reg.team?.id ||
        (typeof reg.team === "string" ? reg.team : null);
      return regTeam && regTeam.toString() === teamIdString;
    });

    return {
      paymentStatus: registration?.paymentStatus || "pending",
      registrationId: registration?._id || null,
    };
  };

  // Helper function to get payment status (for backward compatibility)
  const getPaymentStatus = (tournament, teamId) => {
    return getRegistrationInfo(tournament, teamId).paymentStatus;
  };

  const getTeamEntryFeeTotal = (entryFee = 0) => {
    const teamMemberCount = teamData?.members?.length || 0;
    return entryFee * teamMemberCount;
  };

  useEffect(() => {
    // Check for payment success callback
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      // Update payment status
      const updatePayment = async () => {
        try {
          console.log(
            "Payment success detected, verifying and updating payment status...",
          );

          // Verify payment session and update status
          try {
            const verifyResult = await paymentAPI.verifySession(sessionId);
            console.log("Payment verification result:", verifyResult);

            if (verifyResult.success && verifyResult.paymentStatus === "paid") {
              // Get team data to find which tournament needs updating
              const data = await teamAPI.getMyTeam();
              if (data.team) {
                const teamId = (data.team._id || data.team.id).toString();

                // Fetch all tournaments to find the one that needs payment update
                const [allTournamentsData] = await Promise.all([
                  tournamentAPI
                    .getAll({ limit: 100 })
                    .catch(() => ({ tournaments: [] })),
                ]);

                const allTournaments = allTournamentsData.tournaments || [];

                // Find tournament with pending payment for this team
                for (const tournament of allTournaments) {
                  const registration = tournament.registeredTeams?.find(
                    (reg) => {
                      const regTeam =
                        reg.team?._id ||
                        reg.team?.id ||
                        (typeof reg.team === "string" ? reg.team : null);
                      return regTeam && regTeam.toString() === teamId;
                    },
                  );

                  if (
                    registration &&
                    registration.paymentStatus === "pending"
                  ) {
                    // Update payment status
                    await paymentAPI.updateTournamentPayment({
                      tournamentId: tournament._id,
                      teamId: teamId,
                      paymentStatus: "paid",
                      sessionId: sessionId,
                    });
                    console.log(
                      "Payment status updated for tournament:",
                      tournament._id,
                    );
                    break;
                  }
                }
              }
            }
          } catch (verifyError) {
            console.error("Error verifying payment:", verifyError);
            // Continue anyway - webhook might have updated it
          }

          showSuccess("Payment successful! Your registration is confirmed.");

          // Remove query params
          window.history.replaceState({}, "", "/team-leader");

          // Refresh team data and tournaments
          const data = await teamAPI.getMyTeam();
          if (data.team) {
            const teamIdString = (data.team._id || data.team.id).toString();

            // Fetch all tournaments and filter for this team
            const [allTournamentsData] = await Promise.all([
              tournamentAPI
                .getAll({ limit: 100 })
                .catch(() => ({ tournaments: [] })),
            ]);

            const allTournaments = allTournamentsData.tournaments || [];
            const myTeamTournaments = allTournaments.filter((tournament) => {
              const regs = tournament.registeredTeams || [];
              return regs.some((reg) => {
                const regTeam =
                  reg.team?._id ||
                  reg.team?.id ||
                  (typeof reg.team === "string" ? reg.team : null);
                return regTeam && regTeam.toString() === teamIdString;
              });
            });

            // Set tournaments directly - payment status will be read from registeredTeams array
            setMyTournaments(myTeamTournaments);
            console.log(
              "Tournaments refreshed after payment:",
              myTeamTournaments,
            );
          }
        } catch (error) {
          console.error("Error updating payment:", error);
          showError(
            "Payment successful, but failed to refresh data. Please reload the page.",
          );
        }
      };
      updatePayment();
    } else if (paymentStatus === "canceled") {
      showError("Payment was canceled");
      window.history.replaceState({}, "", "/team-leader");
    }
  }, [isTeamLeader, navigate, showSuccess, showError]);

  useEffect(() => {
    // ProtectedRoute handles role verification and authentication redirect
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const data = await teamAPI.getMyTeam();

        if (data.team) {
          setTeamData(data.team);
          const currentUserId =
            user?.id?.toString?.() ?? user?.id?.toString?.() ?? user?.id;
          // Format team members for display
          // Handle both populated objects and ObjectIds
          const members = data.team.members || [];
          const formattedMembers = members
            .filter((member) => member !== null && member !== undefined)
            .map((member) => {
              // If member is already an object (populated), use it directly
              if (typeof member === "object" && member._id) {
                return {
                  _id: member._id,
                  id: member._id,
                  firstName: member.firstName || "",
                  lastName: member.lastName || "",
                  username: member.username || "",
                  email: member.email || "",
                  phone: member.phone || "",
                  role: member.role || "player",
                  isActive:
                    typeof member.isActive === "boolean"
                      ? member.isActive
                      : true,
                };
              }
              // If member is just an ObjectId string, we need to fetch it
              // This shouldn't happen if populate worked, but handle it anyway
              return {
                _id: member,
                id: member,
                firstName: "",
                lastName: "",
                username: "",
                email: "",
                phone: "",
                role: "player",
                isActive: true,
              };
            });

          console.log("Team data received:", data.team);
          console.log("Formatted members:", formattedMembers);

          setTeamMembers(formattedMembers);

          // Load recent team messages and announcements for initial view
          try {
            const [
              messagesResponse,
              announcementsResponse,
              managementAnnouncementsResponse,
            ] = await Promise.all([
              teamAPI.getTeamMessages(data.team._id || data.team.id),
              teamAPI.getTeamAnnouncements(data.team._id || data.team.id),
              announcementAPI.getManagementAnnouncements().catch(() => ({
                announcements: [],
              })),
            ]);

            const mappedMessages = (messagesResponse.messages || []).map(
              (m) => ({
                id: m._id,
                text: m.text,
                timestamp: m.createdAt,
                sender:
                  (m.sender?._id?.toString?.() ?? m.sender?._id) &&
                  currentUserId &&
                  (m.sender?._id?.toString?.() ?? m.sender?._id) ===
                    currentUserId
                    ? "me"
                    : m.sender?.username || "Teammate",
                senderName:
                  m.sender?.firstName && m.sender?.lastName
                    ? `${m.sender.firstName} ${m.sender.lastName}`
                    : m.sender?.username || "Teammate",
              }),
            );
            setMessages(mappedMessages);

            setAnnouncements(announcementsResponse.announcements || []);
            setManagementAnnouncements(
              managementAnnouncementsResponse.announcements || [],
            );
          } catch (msgError) {
            console.warn(
              "Failed to load team messages/announcements:",
              msgError,
            );
          }

          // Derive My Tournaments & My Matches from global lists using this team ID
          const teamIdString =
            data.team._id?.toString() || data.team.id?.toString();

          // Fetch all tournaments and matches, then filter on the frontend
          const [allTournamentsData, allMatchesData, myNonProfit] =
            await Promise.all([
              tournamentAPI.getAll({ limit: 100 }).catch((error) => {
                console.error("Error fetching tournaments:", error);
                return { tournaments: [] };
              }),
              matchAPI.getAll({ limit: 100 }).catch((error) => {
                console.error("Error fetching matches:", error);
                return { matches: [] };
              }),
              nonprofitAPI.getMine().catch(() => ({ activities: [] })),
            ]);

          const allTournaments = allTournamentsData.tournaments || [];
          const allMatches = allMatchesData.matches || [];
          const myNonProfitActivities = myNonProfit.activities || [];

          // Filter tournaments where this team is registered
          const myTeamTournaments = allTournaments.filter((tournament) => {
            const regs = tournament.registeredTeams || [];
            return regs.some((reg) => {
              const regTeam =
                reg.team?._id ||
                reg.team?.id ||
                (typeof reg.team === "string" ? reg.team : null);
              return regTeam && regTeam.toString() === teamIdString;
            });
          });

          // Filter matches where this team participates (team1 or team2)
          const myTeamMatches = allMatches.filter((match) => {
            const team1Id =
              match.team1?.team?._id ||
              match.team1?.team?.id ||
              (typeof match.team1?.team === "string" ? match.team1.team : null);
            const team2Id =
              match.team2?.team?._id ||
              match.team2?.team?.id ||
              (typeof match.team2?.team === "string" ? match.team2.team : null);

            return (
              (team1Id && team1Id.toString() === teamIdString) ||
              (team2Id && team2Id.toString() === teamIdString)
            );
          });

          console.log("All tournaments:", allTournaments);
          console.log("Derived my tournaments:", myTeamTournaments);
          console.log("All matches:", allMatches);
          console.log("Derived my matches:", myTeamMatches);

          setMyTournaments(myTeamTournaments);
          setMyMatches(myTeamMatches);
          setNonProfitActivities(myNonProfitActivities);

          // Calculate stats
          const now = new Date();
          const upcomingTournaments = myTeamTournaments.filter(
            (t) => new Date(t.startDate) > now,
          );
          const wins = myTeamMatches.filter((m) => {
            if (m.status !== "completed" || !m.result) return false;

            const team1Id =
              m.team1?.team?._id ||
              m.team1?.team?.id ||
              (typeof m.team1?.team === "string" ? m.team1.team : null);
            const team2Id =
              m.team2?.team?._id ||
              m.team2?.team?.id ||
              (typeof m.team2?.team === "string" ? m.team2.team : null);

            const winnerId = m.result.winner?.toString();

            return (
              (team1Id &&
                team1Id.toString() === teamIdString &&
                winnerId === team1Id.toString()) ||
              (team2Id &&
                team2Id.toString() === teamIdString &&
                winnerId === team2Id.toString())
            );
          }).length;

          setStats({
            teamSize: formattedMembers.length,
            eventsRegistered: myTeamTournaments.length,
            upcomingEvents: upcomingTournaments.length,
            totalWins: wins,
          });
        } else {
          console.error("No team data in response:", data);
          showError("Team data not found in response");
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response,
          stack: error.stack,
        });
        showError(error.message || "Failed to fetch team data");
        // Set empty state if team not found
        if (error.message && error.message.includes("not found")) {
          setTeamMembers([]);
          setTeamData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [isTeamLeader, navigate, showError, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-primary-950 text-xl">Loading...</div>
      </div>
    );
  }

  const teamLeaderTabs = [
    { id: "overview", label: "Overview", icon: IoGridOutline },
    { id: "my-tournaments", label: "Tournaments", icon: IoCalendarOutline },
    { id: "my-matches", label: "Matches", icon: IoFootballOutline },
    { id: "my-orders", label: "Team Orders", icon: IoBagOutline },
    { id: "nonprofit", label: "Non Profit Activities", icon: IoHandLeftOutline },
    { id: "roster", label: "Roster Management", icon: IoShirtOutline },
    { id: "communication", label: "Team Chat", icon: IoChatbubblesOutline },
    { id: "reporting", label: "Team Reporting", icon: IoBarChartOutline },
  ];

  const hasPendingPayments = myTournaments.some(
    (t) => getPaymentStatus(t, teamData?._id || teamData?.id) === "pending"
  );

  return (
    <div className="min-h-screen bg-primary-50/60 dark:bg-primary-950">
      <DashboardHeader title="Team Leader Hub" />
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={teamLeaderTabs}
        title="Team Leader"
      />

      <div className="lg:ml-64 pt-16 px-4 sm:px-6 py-6 min-h-screen relative z-0">
        <div className="max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
              <ListItemSkeleton rows={5} />
            </div>
          ) : (
            <>
              {/* Payment Alert Banner */}
              {hasPendingPayments && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl flex-shrink-0">
                      <IoWarningOutline className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Tournament Payment Pending
                      </p>
                      <p className="text-amber-700 dark:text-amber-300/80">
                        One or more registered tournaments require entry fee payment to confirm your team's slot.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("my-tournaments")}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex-shrink-0 cursor-pointer transition-colors"
                  >
                    Resolve →
                  </button>
                </div>
              )}

              {/* Overview-only header and stats */}
              {activeTab === "overview" && (
                <>
                  <motion.div
                    className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          Team Captain
                        </span>
                        {teamData && (
                          <span className="text-xs font-semibold text-secondary-500">
                            Team: {teamData.name}
                          </span>
                        )}
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-primary-950 dark:text-primary-50 mt-1">
                        Captain's Dashboard
                      </h1>
                      <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 mt-0.5">
                        Manage roster, organize registrations, view fixtures and coordinate team operations.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <button
                        onClick={() => setActiveTab("roster")}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white shadow-2xs transition-colors cursor-pointer"
                      >
                        Manage Roster
                      </button>
                      <button
                        onClick={() => navigate("/orders")}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-primary-700 dark:text-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        Team Orders
                      </button>
                    </div>
                  </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                      label="Team Size"
                      value={stats.teamSize}
                      icon={IoPeopleOutline}
                      color="blue"
                      subtitle="Active squad members"
                    />
                    <StatCard
                      label="Events Registered"
                      value={stats.eventsRegistered}
                      icon={IoCalendarOutline}
                      color="green"
                      subtitle="Tournament entries"
                    />
                    <StatCard
                      label="Upcoming Fixtures"
                      value={stats.upcomingEvents}
                      icon={IoFootballOutline}
                      color="purple"
                      subtitle="Matches scheduled"
                    />
                    <StatCard
                      label="Total Wins"
                      value={stats.totalWins}
                      icon={IoTrophyOutline}
                      color="amber"
                      subtitle="Victories on record"
                    />
                  </div>

                  <ManagementAnnouncements announcements={managementAnnouncements} />

                  {/* Real-Time Tracking */}
                  <motion.div
                    className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs my-6"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <RealTimeTracking
                      user={user}
                      teamData={teamData}
                      isTeamLeader={true}
                    />
                  </motion.div>
                </>
              )}

          {/* Tab Content */}
          <div>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Members Section */}
                <motion.div
                  className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-lg font-semibold text-primary-900 mb-4">
                    Team Members
                  </h2>
                  <div className="space-y-3">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member, index) => (
                        <motion.div
                          key={member._id || member.id || index}
                          className="bg-primary-50 border border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-primary-900">
                                {member.firstName && member.lastName
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.username}
                              </p>
                              <p className="text-xs text-primary-600 mt-0.5">
                                {[member.phone, member.email]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 bg-primary-200 text-primary-700 rounded text-xs font-medium">
                                {member.role === "team_leader"
                                  ? "Leader"
                                  : "Player"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  member.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {member.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-primary-600 mb-2">
                          No team members found.
                        </p>
                        {teamData ? (
                          <p className="text-xs text-primary-500">
                            Your team &quot;{teamData.name}&quot; has no members
                            yet.
                          </p>
                        ) : (
                          <p className="text-xs text-primary-500">
                            Team data not available.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab("roster")}
                    className="mt-4 w-full px-4 py-2 bg-primary-900 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    Manage Roster
                  </button>
                </motion.div>

                {/* Events Section */}
                <motion.div
                  className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-lg font-semibold text-primary-900 mb-4">
                    Upcoming Events
                  </h2>
                  <div className="space-y-3">
                    {myTournaments.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-primary-600">
                          No tournaments registered yet
                        </p>
                      </div>
                    ) : myTournaments.filter(
                        (t) => new Date(t.startDate) > new Date(),
                      ).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-primary-600">
                          No upcoming tournaments
                        </p>
                        <p className="text-xs text-primary-500 mt-1">
                          You have {myTournaments.length} registered
                          tournament(s)
                        </p>
                      </div>
                    ) : (
                      myTournaments
                        .filter((t) => new Date(t.startDate) > new Date())
                        .slice(0, 3)
                        .map((tournament, index) => (
                          <motion.div
                            key={tournament._id}
                            className="bg-primary-50 border border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition-colors cursor-pointer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setActiveTab("my-tournaments")}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm text-primary-900">
                                  {tournament.name}
                                </p>
                                <p className="text-xs text-primary-600 mt-0.5">
                                  {new Date(
                                    tournament.startDate,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Registered
                              </span>
                            </div>
                          </motion.div>
                        ))
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab("my-tournaments")}
                    className="mt-4 w-full px-4 py-2 bg-primary-900 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    View All Tournaments
                  </button>
                </motion.div>

                {/* Performance Stats */}
                <motion.div
                  className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-lg font-semibold text-primary-900 mb-4">
                    Team Performance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-2xl font-semibold text-primary-900 mb-1">
                        {myMatches.length > 0
                          ? Math.round(
                              (stats.totalWins /
                                myMatches.filter(
                                  (m) => m.status === "completed",
                                ).length) *
                                100,
                            ) || 0
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-primary-600">Win Rate</p>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-2xl font-semibold text-primary-900 mb-1">
                        {myMatches.length}
                      </p>
                      <p className="text-xs text-primary-600">Total Matches</p>
                    </div>
                    <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-2xl font-semibold text-primary-900 mb-1">
                        {stats.totalWins}
                      </p>
                      <p className="text-xs text-primary-600">Wins</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === "roster" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <RosterManagement
                  teamMembers={teamMembers}
                  teamId={teamData?._id || teamData?.id}
                  onAddMember={async (member) => {
                    try {
                      if (!teamData?._id && !teamData?.id) {
                        showError("Team not found");
                        return;
                      }

                      const teamId = teamData._id || teamData.id;

                      const payload = {
                        username: member.username,
                        phone: member.phone,
                        firstName: member.firstName,
                        lastName: member.lastName,
                      };
                      if (member.email?.trim()) {
                        payload.email = member.email.trim();
                      }
                      const result = await teamAPI.inviteMember(teamId, payload);

                      let inviteMsg =
                        "Member invited successfully! They were sent an SMS with a link to set their password.";
                      if (payload.email) {
                        inviteMsg +=
                          " If an email was provided, they also received the link by email.";
                      }
                      if (result.smsWarning) {
                        inviteMsg += ` ${result.smsWarning}`;
                      } else if (result.smsError) {
                        inviteMsg += ` SMS could not be sent: ${result.smsError}`;
                      }
                      showSuccess(inviteMsg);

                      // Refresh team data to show the new member
                      if (result.team) {
                        const formattedMembers = (
                          result.team.members || []
                        ).map((m) => ({
                          _id: m._id || m.id,
                          id: m._id || m.id,
                          firstName: m.firstName || "",
                          lastName: m.lastName || "",
                          username: m.username || "",
                          email: m.email || "",
                          phone: m.phone || "",
                          role: m.role || "player",
                          isActive:
                            typeof m.isActive === "boolean" ? m.isActive : true,
                        }));
                        setTeamMembers(formattedMembers);
                        setStats((prev) => ({
                          ...prev,
                          teamSize: formattedMembers.length,
                        }));
                      }
                    } catch (error) {
                      showError(error.message || "Failed to add member");
                    }
                  }}
                  onRemoveMember={async (memberId) => {
                    try {
                      if (!teamData?._id && !teamData?.id) {
                        showError("Team not found");
                        return;
                      }
                      await teamAPI.removeMember(
                        teamData._id || teamData.id,
                        memberId,
                      );
                      showSuccess("Member removed successfully");
                      // Refresh team data
                      const data = await teamAPI.getMyTeam();
                      if (data.team) {
                        const formattedMembers = data.team.members.map(
                          (member) => ({
                            _id: member._id || member.id,
                            id: member._id || member.id,
                            firstName: member.firstName,
                            lastName: member.lastName,
                            username: member.username,
                            email: member.email,
                            phone: member.phone,
                            role: member.role,
                            isActive:
                              typeof member.isActive === "boolean"
                                ? member.isActive
                                : true,
                          }),
                        );
                        setTeamMembers(formattedMembers);
                        setStats((prev) => ({
                          ...prev,
                          teamSize: formattedMembers.length,
                        }));
                      }
                    } catch (error) {
                      showError(error.message || "Failed to remove member");
                    }
                  }}
                />
              </motion.div>
            )}

            {activeTab === "communication" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <TeamCommunication
                  teamId={teamData?._id || teamData?.id}
                  initialMessages={messages}
                  announcements={announcements}
                  canPostAnnouncements={true}
                  onAnnouncementCreated={(announcement) => {
                    setAnnouncements((prev) => [announcement, ...prev]);
                  }}
                  onSendMessage={async (text) => {
                    if (!teamData?._id && !teamData?.id) {
                      showError("Team not found");
                      return;
                    }

                    try {
                      const teamId = teamData._id || teamData.id;
                      // Persist via REST as well, mainly to trigger notifications
                      await teamAPI.sendTeamMessage(teamId, text);
                      showSuccess("Message sent to your team");
                    } catch (error) {
                      showError(error.message || "Failed to send team message");
                    }
                  }}
                />
              </motion.div>
            )}

            {activeTab === "my-tournaments" && (
              <motion.div
                className="relative overflow-hidden bg-white border border-primary-200 rounded-2xl p-6 sm:p-8 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Decorative background accents */}
                <div
                  aria-hidden
                  className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-secondary-500/10 blur-3xl pointer-events-none"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
                />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-900 to-secondary-700">
                      My Tournaments
                    </h2>
                    <p className="text-primary-600 mt-1 font-medium">
                      Your registered competitions and events
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary-200 shadow-sm text-primary-800 text-sm font-bold">
                      <IoTrophy className="w-5 h-5 text-secondary-500" />
                      {myTournaments.length} Total Registered
                    </span>
                  </div>
                </div>

                {myTournaments.length === 0 ? (
                  <div className="text-center py-16 relative bg-primary-50/50 rounded-2xl border border-primary-100">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                      <IoTrophy className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-primary-900 mb-2">
                      No registrations yet
                    </h3>
                    <p className="text-primary-600 mb-6 max-w-sm mx-auto">
                      You haven&apos;t registered for any tournaments yet. Ready
                      to compete?
                    </p>
                    <button
                      onClick={() => navigate("/events")}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-900 to-secondary-600 text-white font-bold rounded-xl hover:from-primary-800 hover:to-secondary-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <IoTrophy className="w-5 h-5" />
                      Browse Tournaments
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {myTournaments.map((tournament) => {
                      const teamIdString = (
                        teamData._id || teamData.id
                      ).toString();
                      const registrationInfo = getRegistrationInfo(
                        tournament,
                        teamIdString,
                      );
                      const paymentStatus = registrationInfo.paymentStatus;

                      return (
                        <motion.div
                          key={tournament._id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open tournament details for ${tournament.name}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedTournament(tournament);
                            }
                          }}
                          whileHover={{ y: -4, scale: 1.01 }}
                          className="group relative bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary-500 flex flex-col h-full"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedTournament(tournament)}
                        >
                          <div className="h-44 relative bg-primary-900 overflow-hidden w-full flex-shrink-0">
                            {tournament.image ? (
                              <img
                                src={absoluteMediaSrc(tournament.image) || tournament.image}
                                alt={tournament.name}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950 flex items-center justify-center">
                                <IoTrophy className="w-16 h-16 text-primary-700/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/20 to-transparent pointer-events-none" />

                            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                                  tournament.status === "open"
                                    ? "bg-green-500/90 text-white"
                                    : tournament.status === "in_progress"
                                      ? "bg-blue-500/90 text-white"
                                      : tournament.status === "completed"
                                        ? "bg-purple-500/90 text-white"
                                        : "bg-gray-500/90 text-white"
                                }`}
                              >
                                {tournament.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4">
                              <h3 className="text-xl font-bold text-white line-clamp-2 shadow-sm drop-shadow-md">
                                {tournament.name}
                              </h3>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col bg-white">
                            <div className="space-y-4 flex-1">
                              <div className="flex items-start text-primary-700 text-sm gap-3">
                                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-secondary-600">
                                  <IoCalendar className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-primary-500 font-medium uppercase tracking-wider">
                                    Date
                                  </span>
                                  <span className="font-semibold text-primary-900">
                                    {new Date(
                                      tournament.startDate,
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                    {" - "}
                                    {new Date(
                                      tournament.endDate,
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {tournament.location && (
                                <div className="flex items-start text-primary-700 text-sm gap-3">
                                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-secondary-600">
                                    <IoLocation className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-primary-500 font-medium uppercase tracking-wider">
                                      Location
                                    </span>
                                    <span
                                      className="font-semibold text-primary-900 truncate"
                                      title={tournament.location}
                                    >
                                      {tournament.location}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-4 mt-auto border-t border-primary-100">
                                <div className="flex items-center gap-2">
                                  {tournament.entryFee > 0 ? (
                                    <>
                                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <IoCash className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs text-primary-500 font-medium uppercase tracking-wider">
                                          Entry Fee
                                        </span>
                                        <span className="font-bold text-lg text-primary-900 leading-none">
                                          ${getTeamEntryFeeTotal(tournament.entryFee)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span className="font-bold text-green-600 flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                        <IoTrophy className="w-4 h-4 text-green-600" />
                                      </div>
                                      Free Entry
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                    paymentStatus === "paid"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : paymentStatus === "pending"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {paymentStatus === "paid"
                                    ? "Paid"
                                    : paymentStatus === "pending"
                                      ? "Payment Pending"
                                      : paymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "my-matches" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-primary-900 mb-6">
                  My Matches
                </h2>
                {myMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-primary-600">
                      No matches scheduled for your team yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myMatches.map((match) => {
                      const team1Name =
                        match.team1?.team?.name ||
                        match.team1?.player?.username ||
                        "TBD";
                      const team2Name =
                        match.team2?.team?.name ||
                        match.team2?.player?.username ||
                        "TBD";
                      const isMyTeam1 =
                        match.team1?.team?._id?.toString() ===
                        teamData?._id?.toString();
                      const isMyTeam2 =
                        match.team2?.team?._id?.toString() ===
                        teamData?._id?.toString();

                      return (
                        <motion.div
                          key={match._id}
                          className="bg-primary-50 border border-primary-200 rounded-lg p-5 hover:bg-primary-100 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                                {team1Name} vs {team2Name}
                              </h3>
                              {match.tournament && (
                                <p className="text-sm text-primary-600 mb-1">
                                  <span className="font-medium">
                                    Tournament:
                                  </span>{" "}
                                  {match.tournament.name}
                                </p>
                              )}
                              <p className="text-sm text-primary-600">
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(
                                  match.scheduledDate,
                                ).toLocaleDateString()}
                                {match.scheduledTime &&
                                  ` at ${match.scheduledTime}`}
                              </p>
                              {match.location && (
                                <p className="text-sm text-primary-600">
                                  <span className="font-medium">Location:</span>{" "}
                                  {match.location}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                match.status === "scheduled"
                                  ? "bg-blue-100 text-blue-800"
                                  : match.status === "live"
                                    ? "bg-red-100 text-red-800"
                                    : match.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {match.status}
                            </span>
                          </div>
                          {match.status === "completed" && match.result && (
                            <div className="mt-3 pt-3 border-t border-primary-200">
                              <p className="text-sm font-semibold text-primary-900">
                                Result: {match.result.score.team1Score} -{" "}
                                {match.result.score.team2Score}
                              </p>
                              {match.result.winner && (
                                <p className="text-xs text-primary-600 mt-1">
                                  Winner:{" "}
                                  {isMyTeam1 &&
                                  match.result.winner.toString() ===
                                    match.team1?.team?._id?.toString()
                                    ? "Your Team"
                                    : isMyTeam2 &&
                                        match.result.winner.toString() ===
                                          match.team2?.team?._id?.toString()
                                      ? "Your Team"
                                      : "Opponent"}
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "my-orders" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-primary-900 mb-6">
                  My Orders
                </h2>
                <MyOrders />
              </motion.div>
            )}

            {activeTab === "nonprofit" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-primary-900 mb-6">
                  My Non Profit Activities
                </h2>
                <MyNonProfitActivities activities={nonProfitActivities} />
              </motion.div>
            )}

            {activeTab === "reporting" && (
              <motion.div
                className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <TeamReporting
                  myTournaments={myTournaments}
                  myMatches={myMatches}
                  stats={stats}
                  teamData={teamData}
                  reports={[
                    {
                      id: 1,
                      name: "Q1 Performance Report",
                      date: "2024-03-01",
                      type: "performance",
                    },
                  ]}
                />
              </motion.div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Tournament Details Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <motion.div
            className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTournament(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-primary-950 mb-2">
                    {selectedTournament.name}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedTournament.status === "open"
                          ? "bg-green-100 text-green-800"
                          : selectedTournament.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : selectedTournament.status === "completed"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedTournament.status.replace("_", " ")}
                    </span>
                    {(() => {
                      const teamIdString = (
                        teamData?._id || teamData?.id
                      )?.toString();
                      const paymentStatus = getPaymentStatus(
                        selectedTournament,
                        teamIdString,
                      );
                      return (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : paymentStatus === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          Payment: {paymentStatus}
                        </span>
                      );
                    })()}
                    {selectedTournament.isPromoted && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="text-primary-400 hover:text-primary-600 text-2xl transition-colors"
                >
                  <IoClose />
                </button>
              </div>

              {/* Tournament Image */}
              {selectedTournament.image && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <img
                    src={selectedTournament.image}
                    alt={selectedTournament.name}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Description */}
              {selectedTournament.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">
                    Description
                  </h3>
                  <p className="text-primary-700 leading-relaxed">
                    {selectedTournament.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IoCalendar className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Start Date
                      </p>
                      <p className="text-primary-900 font-semibold">
                        {new Date(
                          selectedTournament.startDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IoCalendar className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        End Date
                      </p>
                      <p className="text-primary-900 font-semibold">
                        {new Date(
                          selectedTournament.endDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IoCalendar className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Registration Deadline
                      </p>
                      <p className="text-primary-900 font-semibold">
                        {new Date(
                          selectedTournament.registrationDeadline,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {(selectedTournament.location ||
                    selectedTournament.venue) && (
                    <div className="flex items-start gap-3">
                      <IoLocation className="text-tertiary-500 text-xl mt-1" />
                      <div>
                        <p className="text-sm font-medium text-primary-600">
                          Location
                        </p>
                        <p className="text-primary-900 font-semibold">
                          {selectedTournament.location ||
                            selectedTournament.venue}
                        </p>
                        {selectedTournament.venue &&
                          selectedTournament.location !==
                            selectedTournament.venue && (
                            <p className="text-sm text-primary-600 mt-1">
                              Venue: {selectedTournament.venue}
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IoPeople className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Tournament Type
                      </p>
                      <p className="text-primary-900 font-semibold capitalize">
                        {selectedTournament.tournamentType === "both"
                          ? "Team & Individual"
                          : selectedTournament.tournamentType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IoInformationCircle className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Format
                      </p>
                      <p className="text-primary-900 font-semibold capitalize">
                        {selectedTournament.format?.replace("-", " ") || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IoPeople className="text-tertiary-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Team Capacity
                      </p>
                      <p className="text-primary-900 font-semibold">
                        {selectedTournament.registeredTeams?.length +
                          selectedTournament.registeredPlayers?.length ||
                          0}{" "}
                        / {selectedTournament.maxTeams} registered
                      </p>
                      {selectedTournament.minTeamMembers &&
                        selectedTournament.maxTeamMembers && (
                          <p className="text-xs text-primary-600 mt-1">
                            Team size: {selectedTournament.minTeamMembers} -{" "}
                            {selectedTournament.maxTeamMembers} members
                          </p>
                        )}
                    </div>
                  </div>

                  {selectedTournament.entryFee > 0 && (
                    <div className="flex items-start gap-3">
                      <IoCash className="text-tertiary-500 text-xl mt-1" />
                      <div>
                        <p className="text-sm font-medium text-primary-600">
                          Entry Fee
                        </p>
                        <p className="text-primary-900 font-semibold text-lg">
                          ${getTeamEntryFeeTotal(selectedTournament.entryFee)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedTournament.prizePool > 0 && (
                    <div className="flex items-start gap-3">
                      <IoTrophy className="text-tertiary-500 text-xl mt-1" />
                      <div>
                        <p className="text-sm font-medium text-primary-600">
                          Prize Pool
                        </p>
                        <p className="text-primary-900 font-semibold text-lg">
                          ${selectedTournament.prizePool}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules */}
              {selectedTournament.rules && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">
                    Rules & Regulations
                  </h3>
                  <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                    <p className="text-primary-700 whitespace-pre-wrap">
                      {selectedTournament.rules}
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="px-6 py-2 border-2 border-primary-300 text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamLeaderDashboard;
