import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoNotifications,
  IoNotificationsOutline,
  IoClose,
} from "react-icons/io5";
import { notificationAPI } from "../services/api";
import { useNotification } from "./NotificationProvider";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { showError } = useNotification();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getAll({ limit: 10 });
      setNotifications(data.notifications || []);
    } catch (error) {
      showError(error.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      showError(error.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      showError(error.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      // Update unread count if it was unread
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      showError(error.message || "Failed to delete notification");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        aria-label="View notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
      >
        {unreadCount > 0 ? (
          <IoNotifications className="w-4 h-4 text-secondary-400" />
        ) : (
          <IoNotificationsOutline className="w-4 h-4" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center tabular-nums"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-[#111215] border border-neutral-800 rounded-xl shadow-2xl z-50 max-h-[480px] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-secondary-400 hover:text-secondary-300 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-neutral-800/60">
              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3.5 hover:bg-neutral-800/40 transition-colors ${
                      !notification.isRead ? "bg-secondary-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          if (!notification.isRead) {
                            handleMarkAsRead(notification._id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-neutral-200">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                        title="Dismiss notification"
                      >
                        <IoClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
