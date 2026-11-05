import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IoLogOutOutline,
  IoPersonCircleOutline,
  IoHomeOutline,
  IoNotificationsOutline,
} from "react-icons/io5";

const logo = "/logo.jpg";

const DashboardHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "team_leader":
        return "Team Leader";
      case "player":
        return "Player";
      default:
        return "Member";
    }
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-primary-950/95 backdrop-blur-md border-b border-primary-200/80 dark:border-primary-800 z-30"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:pl-72">
        {/* Title or Brand Area for Desktop/Tablet */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex lg:hidden items-center gap-2 group cursor-pointer"
          >
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-bold text-primary-950 dark:text-primary-50 group-hover:text-secondary-500 transition-colors">
              The Arena
            </span>
          </Link>

          {title && (
            <div className="hidden lg:flex items-center gap-2.5">
              <span className="text-base font-bold text-primary-950 dark:text-primary-100">
                {title}
              </span>
              <span className="h-4 w-px bg-primary-200 dark:bg-primary-800" />
              <span className="text-xs font-medium text-primary-500">
                Dashboard Portal
              </span>
            </div>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-900 dark:hover:text-white rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
            title="Go to main site"
          >
            <IoHomeOutline className="w-4 h-4" />
            <span>Public Site</span>
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-200/60 dark:border-primary-800/60">
            <div className="w-7 h-7 rounded-full bg-secondary-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.firstName?.[0] || user?.username?.[0] || "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-primary-900 dark:text-primary-100 leading-tight">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || user?.email}
              </span>
              <span className="text-[10px] font-medium text-secondary-600 dark:text-secondary-400 capitalize">
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
            title="Log out"
          >
            <IoLogOutOutline className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
