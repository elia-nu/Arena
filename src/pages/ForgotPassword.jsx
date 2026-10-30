import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "../services/api";
import { useNotification } from "../components/NotificationProvider";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await authAPI.forgotPassword(identifier.trim());
      setIsSubmitted(true);
      showSuccess(
        result.message ||
          "If an account exists with that email or phone, a password reset link has been sent.",
      );
    } catch (error) {
      showError(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop"
          alt="Soccer Field Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-950/80 to-primary-950/90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-secondary-500 mb-2 drop-shadow-lg">
                Forgot Password
              </h2>
              <p className="text-white/90">
                {isSubmitted
                  ? "Check your email or phone for a reset link."
                  : "Enter your email or phone and we'll send you a reset link."}
              </p>
            </div>

            {isSubmitted ? (
              <div className="mt-8 space-y-6 text-center">
                <p className="text-sm text-white/80">
                  The link expires in 1 hour. If you don't receive it, check your
                  spam folder or try again.
                </p>
                <Link
                  to="/login"
                  className="inline-block font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Email or phone
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder-white/60 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all duration-300"
                    placeholder="you@example.com or +1 555 000 0000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
