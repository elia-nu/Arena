import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useNotification } from "../components/NotificationProvider";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const token = query.get("token") || "";
  const emailFromQuery = query.get("email") || "";
  const phoneFromQuery = query.get("phone") || "";
  const isReset = query.get("mode") === "reset";

  const [email] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showError(
        isReset
          ? "Invalid or missing reset link. Please request a new one."
          : "Invalid or missing link. Please contact your team leader.",
      );
      return;
    }

    if (!password || password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authAPI.setPassword({
        token,
        password,
        ...(email ? { email } : {}),
      });
      showSuccess(
        isReset
          ? "Password updated! You can now log in."
          : "Password set! You can now log in.",
      );
      navigate("/login");
    } catch (error) {
      showError(error.message || "Failed to set password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary-950">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-secondary-500 mb-2">
            {isReset ? "Reset Your Password" : "Set Your Password"}
          </h2>
          <p className="text-white/90">
            {isReset
              ? "Choose a new password for your account."
              : "Create a password to activate your account and join your team."}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {(email || phoneFromQuery) && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Account
              </label>
              <input
                type="text"
                value={email || phoneFromQuery}
                disabled
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/60 cursor-not-allowed"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : isReset ? "Update Password" : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;


