import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import EventHistory from "../components/dashboard/EventHistory";
import PaymentHistory from "../components/dashboard/PaymentHistory";
import MyOrders from "../components/dashboard/MyOrders";
import TeamCommunication from "../components/dashboard/TeamCommunication";
import RealTimeTracking from "../components/dashboard/RealTimeTracking";
import MyNonProfitActivities from "../components/dashboard/MyNonProfitActivities";
import ManagementAnnouncements from "../components/dashboard/ManagementAnnouncements";
import StatCard from "../components/dashboard/ui/StatCard";
import EmptyState from "../components/dashboard/ui/EmptyState";
import SectionHeader from "../components/dashboard/ui/SectionHeader";
import { StatCardSkeleton, ListItemSkeleton } from "../components/dashboard/ui/SkeletonLoader";
import {
  IoGridOutline,
  IoCalendarOutline,
  IoCardOutline,
  IoHandLeftOutline,
  IoChatbubblesOutline,
  IoBagOutline,
  IoTrophyOutline,
  IoFootballOutline,
  IoShirtOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import {
  teamAPI,
  tournamentAPI,
  matchAPI,
  nonprofitAPI,
  shopAPI,
  announcementAPI,
} from "../services/api";
import { useNotification } from "../components/NotificationProvider";

const PlayerDashboard = () => {
  const { user, isPlayer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    eventsJoined: 0,
    upcomingEvents: 0,
    totalMatches: 0,
    wins: 0,
  });
  const [eventHistory, setEventHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nonProfitActivities, setNonProfitActivities] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [managementAnnouncements, setManagementAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ProtectedRoute handles role verification and authentication redirect
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const userId = user?._id || user?.id;
        if (!userId) {
          throw new Error("Missing player id");
        }

        const userIdString = userId.toString();

        const getIdString = (value) => {
          if (!value) return null;
          if (typeof value === "string") return value;
          if (typeof value === "object") {
            return (value._id || value.id || null)?.toString?.() || null;
          }
          return null;
        };

        const getPlayerRegistration = (tournament) => {
          const registrations = tournament.registeredPlayers || [];
          return registrations.find((reg) => {
            const playerId =
              getIdString(reg.player) || getIdString(reg.player?._id) || reg.player;
            return playerId && playerId.toString() === userIdString;
          });
        };

        const getTeamRegistration = (tournament, teamId) => {
          const registrations = tournament.registeredTeams || [];
          return registrations.find((reg) => {
            const regTeamId =
              getIdString(reg.team) ||
              (typeof reg.team === "string" ? reg.team : null);
            return regTeamId && regTeamId.toString() === teamId.toString();
          });
        };

        const [
          tournamentResponse,
          matchResponse,
          nonprofitResponse,
          ordersResponse,
          teamResponse,
          managementAnnouncementsResponse,
        ] = await Promise.all([
          tournamentAPI.getAll({ limit: 100 }),
          matchAPI.getAll({ limit: 200 }),
          nonprofitAPI.getMine().catch(() => ({ activities: [] })),
          shopAPI.getOrders().catch(() => ({ orders: [] })),
          teamAPI.getMyTeam().catch(() => ({ team: null })),
          announcementAPI.getManagementAnnouncements().catch(() => ({
            announcements: [],
          })),
        ]);

        const allTournaments = tournamentResponse.tournaments || [];
        const allMatches = matchResponse.matches || [];
        const myNonProfitActivities = nonprofitResponse.activities || [];
        setManagementAnnouncements(
          managementAnnouncementsResponse.announcements || []
        );

        const now = new Date();

        const myPlayerTournaments = allTournaments.filter((t) => {
          const registrations = t.registeredPlayers || [];
          return registrations.some((reg) => {
            const playerId =
              getIdString(reg.player) ||
              (reg.player && (reg.player._id || reg.player.id)) ||
              reg.player;
            return playerId && playerId.toString() === userIdString;
          });
        });

        const team = teamResponse?.team || null;
        const teamIdString = team ? getIdString(team) : null;
        const myTeamTournaments = teamIdString
          ? allTournaments.filter((t) => {
              const regs = t.registeredTeams || [];
              return regs.some((reg) => {
                const regTeamId = getIdString(reg.team);
                return regTeamId && regTeamId.toString() === teamIdString;
              });
            })
          : [];

        const tournamentEntryMap = new Map();

        myPlayerTournaments.forEach((t) => {
          const tournamentId = t._id || t.id;
          if (!tournamentId) return;

          const registration = getPlayerRegistration(t);
          tournamentEntryMap.set(tournamentId, {
            tournament: t,
            registrationSource: "individual",
            registration,
          });
        });

        myTeamTournaments.forEach((t) => {
          const tournamentId = t._id || t.id;
          if (!tournamentId) return;

          const registration = getTeamRegistration(t, teamIdString);
          tournamentEntryMap.set(tournamentId, {
            tournament: t,
            registrationSource: "team",
            registration,
          });
        });

        const events = Array.from(tournamentEntryMap.values()).map(
          ({ tournament, registration, registrationSource }) => ({
            id: tournament._id || tournament.id,
            name: tournament.name,
            date: tournament.startDate,
            location: tournament.location || tournament.venue,
            status: tournament.status,
            result: undefined,
            paymentStatus: registration?.paymentStatus || "pending",
            registrationSource: registrationSource || "individual",
          })
        );

        setEventHistory(events);

        const upcomingEvents = events.filter((e) => {
          const eventDate = e.date ? new Date(e.date) : null;
          return (
            eventDate &&
            eventDate > now &&
            e.status !== "completed" &&
            e.status !== "cancelled"
          );
        });

        const myMatches = allMatches.filter((m) => {
          const p1 = m.team1?.player;
          const p2 = m.team2?.player;
          const p1Id = (p1 && (p1._id || p1.id)) || m.team1?.player;
          const p2Id = (p2 && (p2._id || p2.id)) || m.team2?.player;
          return [p1Id, p2Id].some(
            (pid) => pid && pid.toString() === userId.toString()
          );
        });

        setMatches(myMatches);
        setNonProfitActivities(myNonProfitActivities);
        setOrders(ordersResponse.orders || []);

        const totalMatches = myMatches.length;
        const wins = myMatches.filter((m) => {
          if (m.status !== "completed" || !m.result) return false;
          if (m.result.winnerType !== "User") return false;
          const winnerId = m.result.winner;
          return winnerId && winnerId.toString() === userId.toString();
        }).length;

        setStats({
          eventsJoined: events.length,
          upcomingEvents: upcomingEvents.length,
          totalMatches,
          wins,
        });

        const paymentRecords = Array.from(tournamentEntryMap.values()).map(
          ({ tournament, registration }) => ({
            id: `${tournament._id || tournament.id}-${
              registration?._id || "reg"
            }`,
            eventName: tournament.name,
            amount: tournament.entryFee || 0,
            date: registration?.registeredAt || tournament.startDate,
            status: registration?.paymentStatus || "pending",
            transactionId: undefined,
          })
        );

        setPayments(paymentRecords);

        if (team) {
          setTeamData(team);
          try {
            const messagesTeamId = team._id || team.id;
            const [messagesResponse, announcementsResponse] = await Promise.all(
              [
                teamAPI.getTeamMessages(messagesTeamId),
                teamAPI.getTeamAnnouncements(messagesTeamId),
              ]
            );

            const mappedMessages = (messagesResponse.messages || []).map(
              (m) => ({
                id: m._id,
                text: m.text,
                timestamp: m.createdAt,
                sender: m.sender?._id === user?.id ? "me" : m.sender?.username,
                senderName:
                  m.sender?.firstName && m.sender?.lastName
                    ? `${m.sender.firstName} ${m.sender.lastName}`
                    : m.sender?.username || "Teammate",
              })
            );
            setMessages(mappedMessages);
            setAnnouncements(announcementsResponse.announcements || []);
          } catch (teamError) {
            console.warn("Player team fetch note:", teamError);
          }
        }
      } catch (error) {
        console.error("Error fetching player data:", error);
        showError(error.message || "Failed to load player dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [user?._id, user?.id]);

  const playerTabs = [
    { id: "overview", label: "Overview", icon: IoGridOutline },
    { id: "events", label: "Event History", icon: IoCalendarOutline },
    { id: "payments", label: "Payments", icon: IoCardOutline },
    { id: "nonprofit", label: "Non Profit Activities", icon: IoHandLeftOutline },
    { id: "communication", label: "Team Chat", icon: IoChatbubblesOutline },
    { id: "my-orders", label: "My Orders", icon: IoBagOutline },
  ];

  return (
    <div className="min-h-screen bg-primary-50/60 dark:bg-primary-950">
      <DashboardHeader title="Player Hub" />
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={playerTabs}
        title="Player Hub"
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
              {activeTab === "overview" && (
                <>
                  {/* Overview Hero Header */}
                  <motion.div
                    className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          Active Player
                        </span>
                        <span className="text-xs text-primary-400">
                          ID: #{user?.memberCode || user?._id?.slice(-6) || "MEMBER"}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-primary-950 dark:text-primary-50 mt-1">
                        Welcome, {user?.firstName || user?.username}!
                      </h1>
                      <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 mt-0.5">
                        Track upcoming fixtures, win rates, match history and team discussions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <button
                        onClick={() => navigate("/events")}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white shadow-2xs transition-colors cursor-pointer"
                      >
                        Explore Tournaments
                      </button>
                      <button
                        onClick={() => navigate("/orders")}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-primary-700 dark:text-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        Store Orders
                      </button>
                    </div>
                  </motion.div>

                  {/* Team Status Banner */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center font-bold">
                        <IoShirtOutline className="w-5 h-5" />
                      </div>
                      <div>
                        {teamData ? (
                          <>
                            <p className="text-xs font-bold text-primary-950 dark:text-primary-100 flex items-center gap-1.5">
                              Team: {teamData.name}
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                                Member
                              </span>
                            </p>
                            <p className="text-[11px] text-primary-500">
                              {teamData.members?.length || 1} team members • Roster ready
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-primary-900 dark:text-primary-100">
                              No Team Joined Yet
                            </p>
                            <p className="text-[11px] text-primary-500">
                              Compete with teammates by joining a squad
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {teamData ? (
                      <button
                        onClick={() => setActiveTab("communication")}
                        className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 flex items-center gap-1 cursor-pointer"
                      >
                        Team Chat <IoArrowForwardOutline className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/events")}
                        className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 flex items-center gap-1 cursor-pointer"
                      >
                        Browse Teams <IoArrowForwardOutline className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Events Joined"
                      value={stats.eventsJoined}
                      icon={IoCalendarOutline}
                      color="blue"
                      subtitle="Registered tournaments"
                    />
                    <StatCard
                      label="Upcoming Events"
                      value={stats.upcomingEvents}
                      icon={IoFootballOutline}
                      color="green"
                      subtitle="Scheduled matches"
                    />
                    <StatCard
                      label="Total Matches"
                      value={stats.totalMatches}
                      icon={IoShirtOutline}
                      color="purple"
                      subtitle="Career fixtures"
                    />
                    <StatCard
                      label="Match Victories"
                      value={stats.wins}
                      icon={IoTrophyOutline}
                      color="amber"
                      subtitle={`Win rate: ${
                        stats.totalMatches > 0
                          ? Math.round((stats.wins / stats.totalMatches) * 100)
                          : 0
                      }%`}
                    />
                  </div>

                  {/* Upcoming & Performance Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Upcoming Fixtures */}
                    <motion.div
                      className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 shadow-xs"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-primary-100">
                          Upcoming Fixtures & Events
                        </h2>
                        <button
                          onClick={() => setActiveTab("events")}
                          className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 cursor-pointer"
                        >
                          View All ({eventHistory.length})
                        </button>
                      </div>

                      {eventHistory.length === 0 ? (
                        <EmptyState
                          icon={IoCalendarOutline}
                          title="No registered tournaments"
                          message="Check out ongoing registrations and sign up with your squad."
                          actionLabel="Browse Events"
                          onAction={() => navigate("/events")}
                        />
                      ) : (
                        <div className="space-y-2.5">
                          {eventHistory
                            .filter((event) => {
                              const d = event.date ? new Date(event.date) : null;
                              return d && d > new Date();
                            })
                            .slice(0, 3)
                            .map((event) => {
                              const daysUntil = Math.ceil(
                                (new Date(event.date) - new Date()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              return (
                                <div
                                  key={event.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-primary-50/70 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-xs"
                                >
                                  <div>
                                    <p className="font-semibold text-primary-900 dark:text-primary-100">
                                      {event.name}
                                    </p>
                                    <p className="text-[11px] text-primary-500">
                                      {event.date
                                        ? new Date(event.date).toLocaleDateString()
                                        : "TBD"}{" "}
                                      • {event.location || "Venue TBA"}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-100 text-secondary-800 dark:bg-secondary-900/60 dark:text-secondary-300">
                                    {daysUntil > 0 ? `In ${daysUntil} days` : "Today"}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </motion.div>

                    {/* Performance & Win Rate */}
                    <motion.div
                      className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 shadow-xs"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <h2 className="text-sm font-bold text-primary-950 dark:text-primary-100 mb-4">
                        Performance Breakdown
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium text-primary-600 dark:text-primary-400">
                              Match Win Rate
                            </span>
                            <span className="font-bold text-primary-950 dark:text-primary-100">
                              {stats.totalMatches > 0
                                ? Math.round((stats.wins / stats.totalMatches) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-primary-100 dark:bg-primary-800 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              className="bg-secondary-500 h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  stats.totalMatches > 0
                                    ? (stats.wins / stats.totalMatches) * 100
                                    : 0
                                }%`,
                              }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-center">
                            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                              {stats.wins}
                            </p>
                            <p className="text-[11px] font-semibold text-emerald-800/70 dark:text-emerald-400 uppercase">
                              Victories
                            </p>
                          </div>
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 rounded-xl text-center">
                            <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                              {stats.totalMatches - stats.wins}
                            </p>
                            <p className="text-[11px] font-semibold text-rose-800/70 dark:text-rose-400 uppercase">
                              Losses / Draws
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <ManagementAnnouncements announcements={managementAnnouncements} />

                  <RealTimeTracking
                    user={user}
                    teamData={teamData}
                    isTeamLeader={false}
                  />
                </>
              )}

              {/* INDEPENDENT TAB PANELS */}
              {activeTab === "events" && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader
                    title="Event History"
                    subtitle="All tournaments and matches you are enrolled in"
                  />
                  <EventHistory
                    events={eventHistory}
                    matches={matches}
                    nonProfitActivities={nonProfitActivities}
                  />
                </motion.div>
              )}

              {activeTab === "payments" && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader
                    title="Payment History"
                    subtitle="Tournament entry fees and verified transactions"
                  />
                  <PaymentHistory payments={payments} orders={orders} />
                </motion.div>
              )}

              {activeTab === "nonprofit" && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader
                    title="Community & Non-Profit Activities"
                    subtitle="Social impact events and community contributions"
                  />
                  <MyNonProfitActivities activities={nonProfitActivities} />
                </motion.div>
              )}

              {activeTab === "my-orders" && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader
                    title="Store Orders"
                    subtitle="Merchandise, equipment, and order fulfillment status"
                  />
                  <MyOrders />
                </motion.div>
              )}

              {activeTab === "communication" && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-6 shadow-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader
                    title="Team Communication"
                    subtitle={teamData ? `Squad discussion channel for ${teamData.name}` : "Team required"}
                  />
                  {teamData ? (
                    <TeamCommunication
                      teamId={teamData?._id || teamData?.id}
                      initialMessages={messages}
                      announcements={announcements}
                      onSendMessage={async (text) => {
                        const teamId = teamData._id || teamData.id;
                        try {
                          await teamAPI.sendTeamMessage(teamId, text);
                          showSuccess("Message sent to team channel");
                        } catch (error) {
                          showError(error.message || "Failed to send message");
                        }
                      }}
                    />
                  ) : (
                    <EmptyState
                      icon={IoChatbubblesOutline}
                      title="No team joined"
                      message="You must belong to a team roster to access team communications and announcements."
                      actionLabel="Explore Teams"
                      onAction={() => navigate("/events")}
                    />
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
