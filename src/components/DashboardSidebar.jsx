import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMenu,
  IoClose,
  IoLogOutOutline,
  IoHomeOutline,
  IoChevronForward,
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";

const logo = "/logo.png";

const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  tabs,
  title = "Dashboard",
  showHeader = true,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Group tabs if `group` property exists, otherwise render flat
  const hasGroups = tabs.some((tab) => tab.group);

  // Group structure
  const groupedTabs = tabs.reduce((acc, tab) => {
    const groupKey = tab.group || "Main";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(tab);
    return acc;
  }, {});

  const renderTabButton = (tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <motion.button
        key={tab.id}
        onClick={() => {
          setActiveTab(tab.id);
          setIsMobileOpen(false);
        }}
        whileTap={{ scale: 0.98 }}
        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between group relative cursor-pointer ${
          isActive
            ? "bg-secondary-50 dark:bg-secondary-950/40 text-secondary-600 dark:text-secondary-400 font-semibold shadow-2xs"
            : "text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 hover:text-primary-950 dark:hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span
              className={`text-base transition-colors flex-shrink-0 ${
                isActive
                  ? "text-secondary-500"
                  : "text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-200"
              }`}
            >
              {typeof Icon === "function" ? <Icon className="w-4 h-4" /> : Icon}
            </span>
          )}
          <span className="truncate">{tab.label}</span>
        </div>

        {tab.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-secondary-500 text-white flex-shrink-0">
            {tab.badge}
          </span>
        )}

        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-secondary-500 rounded-r-full" />
        )}
      </motion.button>
    );
  };

  const navContent = (
    <div className="space-y-4">
      {hasGroups ? (
        Object.entries(groupedTabs).map(([groupName, groupTabs]) => (
          <div key={groupName} className="space-y-1">
            {groupName !== "Main" && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-primary-400 dark:text-primary-500 mb-1.5 pt-2">
                {groupName}
              </p>
            )}
            <div className="space-y-0.5">
              {groupTabs.map((tab) => renderTabButton(tab))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-0.5">
          {tabs.map((tab) => renderTabButton(tab))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button Floating */}
      <button
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 bg-white/95 dark:bg-primary-900/90 border border-primary-200 dark:border-primary-800 rounded-xl shadow-xs hover:bg-primary-50 transition-colors backdrop-blur-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation"
      >
        {isMobileOpen ? (
          <IoClose className="w-5 h-5 text-primary-900 dark:text-white" />
        ) : (
          <IoMenu className="w-5 h-5 text-primary-900 dark:text-white" />
        )}
      </button>

      {/* Desktop Fixed Aside */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-primary-950 border-r border-primary-200/80 dark:border-primary-800 z-40 flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-primary-100 dark:border-primary-800/80">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full shadow-2xs" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary-950 dark:text-white group-hover:text-secondary-500 transition-colors tracking-tight">
                Let's Kick It
              </span>
              <span className="text-[10px] font-semibold text-secondary-500 uppercase tracking-widest">
                {title}
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-primary-200 dark:scrollbar-thumb-primary-800">
          {navContent}
        </div>

        {/* Footer info/actions */}
        <div className="p-4 border-t border-primary-100 dark:border-primary-800/80 bg-primary-50/40 dark:bg-primary-900/20">
          <div className="flex items-center justify-between text-xs text-primary-500">
            <span>Logged in as</span>
            <span className="font-semibold text-primary-900 dark:text-primary-200 capitalize">
              {user?.role?.replace("_", " ") || "Member"}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-950/50 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-primary-950 border-r border-primary-200 dark:border-primary-800 z-50 lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-primary-100 dark:border-primary-800">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" />
                  <span className="text-sm font-bold text-primary-950 dark:text-white">
                    {title}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 text-primary-500 hover:text-primary-950 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {navContent}
              </div>

              <div className="p-4 border-t border-primary-100 dark:border-primary-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 transition-colors"
                >
                  <IoLogOutOutline className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
