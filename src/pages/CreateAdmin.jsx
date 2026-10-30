import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../components/NotificationProvider";

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      showError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const { confirmPassword, ...adminData } = formData;
      const response = await fetch(
        "http://localhost:5000/api/admin/create-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(adminData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create admin");
      }

      showSuccess("Admin user created successfully! You can now login.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      showError(error.message || "Failed to create admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="bg-secondary-50/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-primary-200">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-secondary-600 mb-2">
              Create Admin Account
            </h2>
            <p className="text-primary-700">
              Create the first admin user for the system
            </p>
            <p className="text-sm text-primary-600 mt-2">
              This will only work if no admin exists yet
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-primary-700 mb-2"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                    placeholder="Admin"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-primary-700 mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                    placeholder="User"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                  placeholder="admin"
                  minLength={3}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                  placeholder="admin@kickit.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="mt-1 text-xs text-primary-600">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 focus:ring-2 focus:ring-tertiary-500/20 outline-none transition-all duration-300"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-secondary-50 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 hover:from-primary-900 hover:via-primary-800 hover:to-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tertiary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {isSubmitting ? "Creating admin..." : "Create Admin Account"}
            </button>

            <div className="text-center">
              <p className="text-sm text-primary-700">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-tertiary-600 hover:text-tertiary-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateAdmin;
