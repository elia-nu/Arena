import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/NotificationProvider";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(formData.identifier.trim(), formData.password);

    if (result.success) {
      // Check if user is suspended
      if (result.data?.user?.isSuspended) {
        navigate("/suspended");
        return;
      }

      showSuccess("Login successful!");

      // Redirect user to their respective dashboard based on role
      const role = result.data?.user?.role;
      let redirectPath = "/";

      if (role === "admin") {
        redirectPath = "/admin";
      } else if (role === "team_leader") {
        redirectPath = "/team-leader";
      } else if (role === "player") {
        redirectPath = "/player";
      }

      navigate(redirectPath);
    } else {
      // Check if error is due to suspension
      if (result.error?.includes("suspended") || result.error?.includes("Suspended")) {
        navigate("/suspended");
      } else {
        showError(result.error || "Login failed. Please try again.");
      }
    }

    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Image */}
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
          {/* Glassmorphism overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-secondary-500 mb-2 drop-shadow-lg">
                Welcome Back
              </h2>
              <p className="text-white/90">Sign in to your account</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                    value={formData.identifier}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder-white/60 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all duration-300"
                    placeholder="you@example.com or +1 555 000 0000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder-white/60 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-tertiary-500 focus:ring-tertiary-500 border-primary-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-white"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <div className="text-center">
                <p className="text-sm text-white">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
