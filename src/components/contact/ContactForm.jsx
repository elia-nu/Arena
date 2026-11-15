import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMailOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoChatbubblesOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoArrowForward,
  IoTrophyOutline,
  IoPeopleOutline,
  IoFootballOutline,
  IoBagHandleOutline,
  IoHelpCircleOutline,
  IoFlashOutline,
} from "react-icons/io5";
import { contactAPI } from "../../services/api";
import SpotlightCard from "../reactbits/SpotlightCard";

const TOPIC_PRESETS = [
  {
    label: "Tournaments & Matches",
    icon: IoTrophyOutline,
    subject: "Tournament Registration & Rules",
  },
  {
    label: "Sponsorship & Brands",
    icon: IoPeopleOutline,
    subject: "Sponsorship & Partnership Opportunity",
  },
  {
    label: "Youth Academy",
    icon: IoFootballOutline,
    subject: "Youth Program & Family Inquiry",
  },
  {
    label: "Shop & Orders",
    icon: IoBagHandleOutline,
    subject: "Merchandise & Order Support",
  },
  {
    label: "General Inquiry",
    icon: IoHelpCircleOutline,
    subject: "General Inquiry",
  },
];

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [selectedTopic, setSelectedTopic] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Please enter or pick a subject";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message cannot be empty";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Please write at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTopicSelect = (preset) => {
    setSelectedTopic(preset.label);
    setFormData((prev) => ({
      ...prev,
      subject: preset.subject,
    }));
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await contactAPI.submit(formData);

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSelectedTopic("");
      setErrors({});

      setTimeout(() => setSubmitStatus(null), 6000);
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const charCount = formData.message.length;
  const isMessageValid = charCount >= 10;

  return (
    <SpotlightCard
      className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(254,87,35,0.08)] hover:border-secondary-500/50 transition-all duration-300"
      spotlightColor="rgba(254, 87, 35, 0.08)"
      borderColor="rgba(254, 87, 35, 0.45)"
      glowRadius={440}
    >
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-150 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-600 text-[11px] font-mono uppercase tracking-widest mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
            </span>
            Direct Communications Line
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Send us a <span className="text-secondary-500">Message</span>
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            Fill in your details below and our operations desk in Addis Ababa & Hawassa will follow up directly.
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
            Average Response
          </span>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-1 px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 whitespace-nowrap shadow-sm">
            <IoFlashOutline className="text-secondary-400" />
            &lt; 24h Turnaround
          </span>
        </div>
      </div>

      {/* Preset Category Chips */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-2.5">
          Select Topic (Quick Fill)
        </label>
        <div className="flex flex-wrap gap-2">
          {TOPIC_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedTopic === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleTopicSelect(preset)}
                className={`group px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-neutral-950 text-white font-semibold shadow-md border border-neutral-950 scale-[1.02]"
                    : "bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200/80 hover:border-neutral-300"
                }`}
              >
                <Icon
                  className={`text-sm transition-transform duration-200 ${
                    isSelected
                      ? "text-secondary-400 scale-110"
                      : "text-neutral-500 group-hover:text-secondary-600 group-hover:scale-110"
                  }`}
                />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submission Feedback Banners */}
      <AnimatePresence>
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="mb-6 p-4 bg-secondary-50 border border-secondary-300 rounded-2xl flex items-center gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-secondary-500/30">
              <IoCheckmarkCircle className="text-2xl" />
            </div>
            <div>
              <p className="font-bold text-neutral-950 text-sm">
                Message Transmitted Successfully
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                Our operations desk in Addis Ababa & Hawassa has received your note and will review it promptly.
              </p>
            </div>
          </motion.div>
        )}

        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <IoCloseCircle className="text-2xl" />
            </div>
            <div>
              <p className="font-bold text-neutral-950 text-sm">Transmission Error</p>
              <p className="text-xs text-red-600 mt-0.5">
                Please check your entries or reach out via our direct email link on the right.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Elements */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="contact-name"
              className="block text-[11px] font-mono uppercase tracking-widest text-neutral-700 mb-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <IoPersonOutline
                  className={
                    focusedField === "name"
                      ? "text-secondary-500"
                      : "text-neutral-400"
                  }
                />
                Full Name
              </span>
              <span className="text-secondary-500 font-bold">*</span>
            </label>
            <div
              className={`relative rounded-2xl border transition-all duration-200 ${
                errors.name
                  ? "border-red-400 bg-red-50/50"
                  : focusedField === "name"
                  ? "border-secondary-500 ring-4 ring-secondary-500/10 bg-white shadow-sm"
                  : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 hover:bg-white"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                <IoPersonOutline />
              </div>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={formData.name}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Marcus Vance"
                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none font-medium"
                required
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-[11px] font-mono uppercase tracking-widest text-neutral-700 mb-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <IoMailOutline
                  className={
                    focusedField === "email"
                      ? "text-secondary-500"
                      : "text-neutral-400"
                  }
                />
                Email Address
              </span>
              <span className="text-secondary-500 font-bold">*</span>
            </label>
            <div
              className={`relative rounded-2xl border transition-all duration-200 ${
                errors.email
                  ? "border-red-400 bg-red-50/50"
                  : focusedField === "email"
                  ? "border-secondary-500 ring-4 ring-secondary-500/10 bg-white shadow-sm"
                  : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 hover:bg-white"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                <IoMailOutline />
              </div>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={formData.email}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="marcus@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none font-medium"
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="contact-subject"
            className="block text-[11px] font-mono uppercase tracking-widest text-neutral-700 mb-2 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <IoDocumentTextOutline
                className={
                  focusedField === "subject"
                    ? "text-secondary-500"
                    : "text-neutral-400"
                }
              />
              Subject / Topic
            </span>
            <span className="text-secondary-500 font-bold">*</span>
          </label>
          <div
            className={`relative rounded-2xl border transition-all duration-200 ${
              errors.subject
                ? "border-red-400 bg-red-50/50"
                : focusedField === "subject"
                ? "border-secondary-500 ring-4 ring-secondary-500/10 bg-white shadow-sm"
                : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 hover:bg-white"
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <IoDocumentTextOutline />
            </div>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              value={formData.subject}
              onFocus={() => setFocusedField("subject")}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="e.g. Tournament Registration, Partnership, or Rule Question"
              className="w-full pl-11 pr-4 py-3.5 bg-transparent text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none font-medium"
              required
            />
          </div>
          {errors.subject && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="contact-message"
              className="text-[11px] font-mono uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-bold"
            >
              <IoChatbubblesOutline
                className={
                  focusedField === "message"
                    ? "text-secondary-500"
                    : "text-neutral-400"
                }
              />
              Message Details
              <span className="text-secondary-500 font-bold">*</span>
            </label>
            <span
              className={`text-xs font-mono font-semibold ${
                isMessageValid ? "text-secondary-600" : "text-neutral-400"
              }`}
            >
              {charCount} / 10 min characters
            </span>
          </div>
          <div
            className={`relative rounded-2xl border transition-all duration-200 ${
              errors.message
                ? "border-red-400 bg-red-50/50"
                : focusedField === "message"
                ? "border-secondary-500 ring-4 ring-secondary-500/10 bg-white shadow-sm"
                : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 hover:bg-white"
            }`}
          >
            <textarea
              id="contact-message"
              name="message"
              value={formData.message}
              onFocus={() => setFocusedField("message")}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={5}
              placeholder="Provide details about your inquiry, squad, or project..."
              className="w-full px-4 py-3.5 bg-transparent text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none resize-none font-medium"
              required
            />
          </div>
          {errors.message && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit Button (Matching HeroSection pill button style) */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full group overflow-hidden rounded-full font-black uppercase tracking-wider text-sm transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-secondary-500/30 hover:shadow-secondary-500/50 hover:scale-[1.01] active:scale-[0.99]"
          whileHover={!isSubmitting ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting ? { scale: 0.99 } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 via-[#ff6a28] to-secondary-600 transition-all duration-300" />

          <div className="relative px-8 py-4 flex items-center justify-center gap-3 text-white">
            {isSubmitting ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span>Transmitting Details...</span>
              </>
            ) : (
              <>
                <span>Transmit Message to Arena Desk</span>
                <IoArrowForward className="text-lg transition-transform duration-300 group-hover:translate-x-1.5" />
              </>
            )}
          </div>
        </motion.button>
      </form>
    </SpotlightCard>
  );
};

export default ContactForm;
