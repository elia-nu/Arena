import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardStats from "../components/admin/DashboardStats";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import EventsManagement from "../components/admin/EventsManagement";
import ProductsManagement from "../components/admin/ProductsManagement";
import OrdersManagement from "../components/admin/OrdersManagement";
import CouponsManagement from "../components/admin/CouponsManagement";
import MediaManagement from "../components/admin/MediaManagement";
import NonProfitActivitiesManagement from "../components/admin/NonProfitActivitiesManagement";
import CommunityImpactManagement from "../components/admin/CommunityImpactManagement";
import AnalyticsPanel from "../components/admin/AnalyticsPanel";
import EventAnalytics from "../components/admin/EventAnalytics";
import ParticipantTracking from "../components/admin/ParticipantTracking";
import PaymentSettings from "../components/admin/PaymentSettings";
import BrandingSettings from "../components/admin/BrandingSettings";
import ContactInfoSettings from "../components/admin/ContactInfoSettings";
import Reports from "../components/admin/Reports";
import StripePayments from "../components/admin/StripePayments";
import ProductOrderReports from "../components/admin/ProductOrderReports";
import UserManagement from "../components/admin/UserManagement";
import RealTimeMonitoring from "../components/admin/RealTimeMonitoring";
import TestimonialsManagement from "../components/admin/TestimonialsManagement";
import TeamManagement from "../components/admin/TeamManagement";
import ZellePaymentsManagement from "../components/admin/ZellePaymentsManagement";
import ContactMessagesManagement from "../components/admin/ContactMessagesManagement";
import ManagementAnnouncements from "../components/admin/ManagementAnnouncements";
import QuickActions from "../components/dashboard/ui/QuickActions";
import TeamsDirectoryWidget from "../components/dashboard/ui/TeamsDirectoryWidget";
import PlayersDirectoryWidget from "../components/dashboard/ui/PlayersDirectoryWidget";
import {
  IoGridOutline,
  IoCalendarOutline,
  IoBagOutline,
  IoCubeOutline,
  IoPricetagOutline,
  IoImagesOutline,
  IoHandLeftOutline,
  IoEarthOutline,
  IoChatbubblesOutline,
  IoMailOutline,
  IoMegaphoneOutline,
  IoPulseOutline,
  IoCardOutline,
  IoCashOutline,
  IoBarChartOutline,
  IoPeopleOutline,
  IoTrendingUpOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoShirtOutline,
  IoSettingsOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import { adminAPI, userAPI, tournamentAPI } from "../services/api";

const AdminDashboard = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [dateRange, setDateRange] = useState("30");
  const [settingsTab, setSettingsTab] = useState("payment");
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, usersData, tournamentsData] = await Promise.all([
          adminAPI.getStats().catch((err) => {
            console.error("Failed to load admin stats:", err);
            return null;
          }),
          userAPI.getAllUsers().catch(() => ({ users: [] })),
          tournamentAPI.getAll().catch(() => ({ tournaments: [] })),
        ]);

        if (statsData) {
          setStats({
            totalUsers: statsData.totalUsers || 0,
            totalTeams: statsData.totalTeams || 0,
            totalEvents: statsData.totalEvents || 0,
            totalRevenue: statsData.totalRevenue || 0,
          });
        }

        const users = Array.isArray(usersData?.users) ? usersData.users : [];
        const sortedRecentUsers = [...users]
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          )
          .slice(0, 6);
        setRecentUsers(sortedRecentUsers);

        const tournaments = Array.isArray(tournamentsData?.tournaments)
          ? tournamentsData.tournaments
          : [];
        setRecentTournaments(tournaments.slice(0, 4));
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSavePaymentSettings = async (settings) => {
    console.log("Payment settings saved:", settings);
  };

  const adminTabs = [
    { id: "overview", label: "Overview", icon: IoGridOutline, group: null },
    // Management
    { id: "events", label: "Events", icon: IoCalendarOutline, group: "Management" },
    { id: "products", label: "Products", icon: IoBagOutline, group: "Management" },
    { id: "orders", label: "Orders", icon: IoCubeOutline, group: "Management" },
    { id: "coupons", label: "Coupons", icon: IoPricetagOutline, group: "Management" },
    { id: "media", label: "Media Hub", icon: IoImagesOutline, group: "Management" },
    // Community
    { id: "nonprofit", label: "Non Profit Activities", icon: IoHandLeftOutline, group: "Community" },
    { id: "community-impact", label: "Community Impact", icon: IoEarthOutline, group: "Community" },
    { id: "testimonials", label: "Testimonials", icon: IoChatbubblesOutline, group: "Community" },
    { id: "contact-messages", label: "Contact Messages", icon: IoMailOutline, group: "Community" },
    { id: "announcements", label: "Announcements", icon: IoMegaphoneOutline, group: "Community" },
    // Analytics & Reports
    { id: "monitoring", label: "Real-Time Monitoring", icon: IoPulseOutline, group: "Analytics" },
    { id: "event-analytics", label: "Event Analytics", icon: IoBarChartOutline, group: "Analytics" },
    { id: "participants", label: "Participant Tracking", icon: IoPeopleOutline, group: "Analytics" },
    { id: "product-order-reports", label: "Sales Reports", icon: IoTrendingUpOutline, group: "Analytics" },
    { id: "reports", label: "System Reports", icon: IoDocumentTextOutline, group: "Analytics" },
    // Payments
    { id: "stripe-payments", label: "Stripe Payments", icon: IoCardOutline, group: "Payments" },
    { id: "zelle-payments", label: "Manual Payments", icon: IoCashOutline, group: "Payments" },
    // People
    { id: "users", label: "User Management", icon: IoPersonOutline, group: "People" },
    { id: "teams", label: "Team Management", icon: IoShirtOutline, group: "People" },
    // System
    { id: "settings", label: "Settings", icon: IoSettingsOutline, group: "System" },
  ];

  const quickActionsList = [
    { label: "+ New Event", icon: IoCalendarOutline, onClick: () => setActiveTab("events") },
    { label: "+ Add Product", icon: IoBagOutline, onClick: () => setActiveTab("products") },
    { label: "+ Post Announcement", icon: IoMegaphoneOutline, onClick: () => setActiveTab("announcements") },
    { label: "Assign Players", icon: IoShirtOutline, onClick: () => setActiveTab("teams") },
    { label: "Check Orders", icon: IoCubeOutline, onClick: () => setActiveTab("orders") },
    { label: "Live System", icon: IoPulseOutline, onClick: () => setActiveTab("monitoring") },
  ];

  return (
    <div className="min-h-screen bg-primary-50/60 dark:bg-primary-950">
      <DashboardHeader title="Admin Command Center" />
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={adminTabs}
        title="Admin Panel"
      />

      <div className="lg:ml-64 pt-16 px-4 sm:px-6 py-6 min-h-screen relative z-0">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Overview Top Hero Banner */}
              <motion.div
                className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300">
                      Live Overview
                    </span>
                    <span className="text-xs text-primary-400">
                      {new Date().toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-primary-950 dark:text-primary-50 mt-1">
                    Welcome back, {user?.firstName || user?.username || "Admin"}
                  </h1>
                  <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 mt-0.5">
                    Monitor events, team registrations, user growth, and store operations.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="text-xs text-primary-500 font-medium">Analytics Period:</span>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-1.5 border border-primary-200 dark:border-primary-700 rounded-xl bg-primary-50 dark:bg-primary-800 text-xs font-semibold text-primary-800 dark:text-primary-100 focus:outline-none focus:ring-1 focus:ring-secondary-500 cursor-pointer shadow-2xs"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
              </motion.div>

              {/* Quick Actions Bar */}
              <QuickActions actions={quickActionsList} />

              {/* Stat Cards */}
              <DashboardStats stats={stats} />

              {/* Mid-Row: Teams Directory & Unassigned Players Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TeamsDirectoryWidget onNavigateToTeams={() => setActiveTab("teams")} />
                <PlayersDirectoryWidget onNavigateToAssign={() => setActiveTab("teams")} />
              </div>

              {/* Event Registrations Quick Hub */}
              {recentTournaments.length > 0 && (
                <motion.div
                  className="bg-white dark:bg-primary-900/40 rounded-2xl p-5 sm:p-6 shadow-xs border border-primary-200/80 dark:border-primary-800"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                          <IoTrophyOutline className="w-4 h-4" />
                        </span>
                        <h2 className="text-base font-bold text-primary-950 dark:text-primary-100">
                          Active Events & Registrations
                        </h2>
                      </div>
                      <p className="text-xs text-primary-500 mt-0.5">
                        Track tournament capacities, registered team rosters, and individual players
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("events")}
                      className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 transition-colors cursor-pointer"
                    >
                      Manage All Events →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {recentTournaments.map((tourn) => {
                      const teamsCount = tourn.registeredTeams?.length || 0;
                      const playersCount = tourn.registeredPlayers?.length || 0;
                      const totalRegistered = teamsCount + playersCount;
                      const maxCapacity = tourn.maxTeams || 16;
                      const percentage = Math.min(100, Math.round((totalRegistered / maxCapacity) * 100));

                      return (
                        <div
                          key={tourn._id}
                          className="p-3.5 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/20 flex flex-col justify-between space-y-2.5 hover:border-secondary-400 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-600 dark:text-secondary-400">
                                {tourn.format || "Knockout"}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-primary-200/70 dark:bg-primary-800 text-primary-800 dark:text-primary-200 capitalize">
                                {tourn.status?.replace("_", " ") || "Draft"}
                              </span>
                            </div>
                            <h4 className="font-bold text-primary-950 dark:text-primary-100 text-sm truncate">
                              {tourn.name}
                            </h4>
                            <p className="text-[11px] text-primary-500 mt-0.5">
                              {tourn.startDate ? new Date(tourn.startDate).toLocaleDateString() : "TBD"}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-primary-600 dark:text-primary-400 font-medium">
                                Capacity: {totalRegistered} / {maxCapacity}
                              </span>
                              <span className="font-bold text-primary-800 dark:text-primary-200">
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-primary-200 dark:bg-primary-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-secondary-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-primary-500 pt-0.5">
                              <span>{teamsCount} Teams</span>
                              <span>{playersCount} Solo Players</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab("events")}
                            className="w-full py-1.5 text-center text-[11px] font-semibold text-secondary-600 hover:text-secondary-700 bg-secondary-50 hover:bg-secondary-100 dark:bg-secondary-900/30 rounded-lg transition-colors cursor-pointer"
                          >
                            Inspect Registrations
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Recently Registered Users */}
              <motion.div
                className="bg-white dark:bg-primary-900/40 rounded-2xl p-5 sm:p-6 shadow-xs border border-primary-200/80 dark:border-primary-800"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-primary-950 dark:text-primary-100">
                      Recently Registered Users
                    </h2>
                    <p className="text-xs text-primary-500">
                      Latest members who joined the platform
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 transition-colors cursor-pointer"
                  >
                    View All Users →
                  </button>
                </div>

                {recentUsers.length === 0 ? (
                  <p className="text-xs text-primary-500 py-4 text-center">
                    No registered users found yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentUsers.map((u) => (
                      <div
                        key={u._id || u.id}
                        className="flex items-center justify-between rounded-xl border border-primary-100 dark:border-primary-800/60 bg-primary-50/50 dark:bg-primary-900/20 p-3 text-xs hover:border-primary-200 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-primary-950 dark:text-primary-100 truncate">
                              {u.firstName || u.lastName
                                ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                                : u.username || "Unknown"}
                            </p>
                            {u.isMinor && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                                Youth
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-primary-500 truncate">
                            {u.email || `@${u.username}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {u.memberCode && (
                              <span className="font-mono text-[9px] text-secondary-600 font-bold bg-secondary-50 dark:bg-secondary-900/40 px-1 rounded">
                                {u.memberCode}
                              </span>
                            )}
                            {u.team ? (
                              <span className="text-[10px] text-indigo-600 font-semibold truncate">
                                🛡️ {u.team.name || "In Team"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Free Agent
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-200/70 dark:bg-primary-800 text-primary-700 dark:text-primary-300 capitalize">
                            {(u.role || "player").replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Analytics Panel wired with current dateRange */}
              <div className="mt-2">
                <AnalyticsPanel dateRange={dateRange} />
              </div>
            </>
          )}

          {/* Other Tabs */}
          {activeTab === "monitoring" && <RealTimeMonitoring />}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "teams" && <TeamManagement />}
          {activeTab === "stripe-payments" && <StripePayments />}
          {activeTab === "zelle-payments" && <ZellePaymentsManagement />}
          {activeTab === "product-order-reports" && <ProductOrderReports />}
          {activeTab === "event-analytics" && <EventAnalytics />}
          {activeTab === "participants" && <ParticipantTracking />}
          {activeTab === "events" && <EventsManagement />}
          {activeTab === "products" && <ProductsManagement />}
          {activeTab === "orders" && <OrdersManagement />}
          {activeTab === "coupons" && <CouponsManagement />}
          {activeTab === "media" && <MediaManagement />}
          {activeTab === "nonprofit" && <NonProfitActivitiesManagement />}
          {activeTab === "community-impact" && <CommunityImpactManagement />}
          {activeTab === "testimonials" && <TestimonialsManagement />}
          {activeTab === "contact-messages" && <ContactMessagesManagement />}
          {activeTab === "announcements" && <ManagementAnnouncements />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-primary-200 dark:border-primary-800">
                {[
                  { id: "payment", label: "Payment Gateways" },
                  { id: "branding", label: "Branding" },
                  { id: "contact", label: "Contact Info" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`px-5 py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
                      settingsTab === tab.id
                        ? "text-secondary-500 border-secondary-500"
                        : "text-primary-500 border-transparent hover:text-primary-900 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {settingsTab === "payment" && (
                <PaymentSettings onSave={handleSavePaymentSettings} />
              )}
              {settingsTab === "branding" && (
                <BrandingSettings onSave={handleSavePaymentSettings} />
              )}
              {settingsTab === "contact" && (
                <ContactInfoSettings onSave={handleSavePaymentSettings} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
