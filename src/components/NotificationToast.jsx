import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoInformationCircle,
  IoWarning,
} from "react-icons/io5";

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.autoClose !== false) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const icons = {
    success: IoCheckmarkCircle,
    error: IoCloseCircle,
    info: IoInformationCircle,
    warning: IoWarning,
  };

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-accent-500",
    warning: "bg-tertiary-500",
  };

  const Icon = icons[notification.type] || IoInformationCircle;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 max-w-md w-full"
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="bg-secondary-50 rounded-2xl shadow-2xl border-2 border-primary-200 overflow-hidden">
          <div className="flex items-start gap-4 p-4">
            <motion.div
              className={`${
                colors[notification.type] || colors.info
              } rounded-full p-2 flex-shrink-0`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="text-secondary-50 text-xl" />
            </motion.div>

            <div className="flex-1 min-w-0">
              {notification.title && (
                <h4 className="font-bold text-secondary-600 mb-1">
                  {notification.title}
                </h4>
              )}
              <p className="text-primary-700 text-sm">{notification.message}</p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 text-primary-400 hover:text-primary-600 transition-colors"
            >
              <IoCloseCircle className="text-xl" />
            </button>
          </div>

          {/* Progress Bar */}
          {notification.autoClose !== false && (
            <motion.div
              className="h-1 bg-primary-200"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: notification.duration || 5000,
                ease: "linear",
              }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;
