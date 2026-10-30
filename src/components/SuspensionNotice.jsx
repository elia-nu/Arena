import { motion } from "framer-motion";
import { IoBan, IoLogOut, IoMail } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";

const SuspensionNotice = () => {
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary-950 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <IoBan className="text-4xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Account Suspended</h1>
              <p className="text-red-100 mt-1">
                Your account has been temporarily suspended
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Suspension Details
            </h2>
            <div className="space-y-2 text-red-800">
              <p>
                <span className="font-semibold">Account:</span>{" "}
                {user?.username || user?.email || "Your account"}
              </p>
              {user?.suspendedAt && (
                <p>
                  <span className="font-semibold">Suspended On:</span>{" "}
                  {new Date(user.suspendedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Suspension Reason */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <IoBan className="text-red-600" />
              Reason for Suspension
            </h3>
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
              {user?.suspensionReason || "No reason provided"}
            </p>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <IoMail className="text-blue-600 text-xl mt-1 flex-shrink-0" />
              <div className="text-blue-800">
                <p className="font-semibold mb-1">Need Help?</p>
                <p className="text-sm">
                  If you believe this suspension was made in error, please
                  contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <IoLogOut />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuspensionNotice;

