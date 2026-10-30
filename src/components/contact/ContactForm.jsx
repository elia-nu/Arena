import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  IoMailOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoChatbubblesOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";
import { contactAPI } from "../../services/api";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Submit via API
      await contactAPI.submit(formData);

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");

      // Reset error message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <motion.div
      className="bg-white border-2 border-primary-200 rounded-3xl p-8 shadow-lg shadow-primary-900/5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-400 flex items-center justify-center">
          <IoMailOutline className="text-2xl text-primary-50" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-secondary-600">
            Send us a message
          </h2>
          <p className="text-primary-600 text-sm mt-1">
            We'll get back to you within 24 hours
          </p>
        </div>
      </div>

      <AnimatePresence>
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-secondary-50 border-2 border-secondary-200 rounded-xl flex items-center gap-3"
          >
            <IoCheckmarkCircle className="text-2xl text-secondary-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-secondary-900">
                Message sent successfully!
              </p>
              <p className="text-sm text-secondary-700">
                We'll respond to your inquiry soon.
              </p>
            </div>
          </motion.div>
        )}

        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-primary-100 border-2 border-primary-300 rounded-xl flex items-center gap-3"
          >
            <IoCloseCircle className="text-2xl text-primary-700 flex-shrink-0" />
            <div>
              <p className="font-semibold text-primary-900">
                Failed to send message
              </p>
              <p className="text-sm text-primary-700">
                Please try again or contact us directly.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-primary-800 font-semibold mb-2 flex items-center gap-2"
          >
            <IoPersonOutline className="text-secondary-500" />
            Full Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
              errors.name
                ? "border-secondary-300 bg-secondary-50"
                : "border-primary-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
            }`}
            placeholder="John Doe"
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-secondary-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-primary-800 font-semibold mb-2 flex items-center gap-2"
          >
            <IoMailOutline className="text-secondary-500" />
            Email Address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
              errors.email
                ? "border-secondary-300 bg-secondary-50"
                : "border-primary-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
            }`}
            placeholder="john@example.com"
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-secondary-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-subject"
            className="block text-primary-800 font-semibold mb-2 flex items-center gap-2"
          >
            <IoDocumentTextOutline className="text-secondary-500" />
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
              errors.subject
                ? "border-secondary-300 bg-secondary-50"
                : "border-primary-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
            }`}
            placeholder="How can we help?"
            required
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-secondary-600">{errors.subject}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block text-primary-800 font-semibold mb-2 flex items-center gap-2"
          >
            <IoChatbubblesOutline className="text-secondary-500" />
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            rows={6}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all resize-none ${
              errors.message
                ? "border-secondary-300 bg-secondary-50"
                : "border-primary-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
            }`}
            placeholder="Tell us more about your inquiry..."
            required
          />
          <div className="flex justify-between items-center mt-1">
            {errors.message && (
              <p className="text-sm text-secondary-600">{errors.message}</p>
            )}
            <p
              className={`text-xs ml-auto ${
                formData.message.length < 10
                  ? "text-primary-500"
                  : "text-primary-400"
              }`}
            >
              {formData.message.length} characters
            </p>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-gradient-to-r from-secondary-500 to-secondary-400 text-primary-50 font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={!isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-primary-50 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Sending...
            </>
          ) : (
            <>
              <IoMailOutline className="text-xl" />
              Send Message
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ContactForm;
