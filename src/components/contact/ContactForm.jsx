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
      className="bg-[#0a0a0a] border border-neutral-800 shadow-2xl p-6 sm:p-8 lg:p-10"
      spotlightColor="rgba(254, 87, 35, 0.22)"
      borderColor="rgba(254, 87, 35, 0.55)"
      glowRadius={440}
    >
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/10 border border-secondary-500/30 text-secondary-400 text-[11px] font-mono uppercase tracking-widest mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
            </span>
            Direct Communications Line
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Send us a <span className="text-secondary-400">Message</span>
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Fill in your details below and our operations desk will follow up directly.
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
            Average Response
          </span>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 whitespace-nowrap">
            <IoFlashOutline className="text-secondary-400" />
            &lt; 24h Turnaround
          </span>
        </div>
      </div>

      {/* Preset Category Chips with Vector Icons */}
      <div className="mb-6">
        <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-2.5">
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
                className={`group px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-secondary-500 text-white font-semibold shadow-lg shadow-secondary-500/25 border border-secondary-400 scale-[1.02]"
                    : "bg-[#111111] hover:bg-[#181818] text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                }`}
              >
                <Icon
                  className={`text-sm transition-transform duration-200 ${
                    isSelected
                      ? "text-white scale-110"
                      : "text-secondary-400 group-hover:scale-110"
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
            className="mb-6 p-4 bg-gradient-to-r from-secondary-500/15 via-secondary-500/10 to-transparent border border-secondary-500/40 rounded-2xl flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-secondary-500/30">
              <IoCheckmarkCircle className="text-2xl" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                Message Transmitted Successfully
              </p>
              <p className="text-xs text-neutral-300 mt-0.5">
                Our Seattle desk has received your note and will review it shortly.
              </p>
            </div>
          </motion.div>
        )}

        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-2xl flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <IoCloseCircle className="text-2xl" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Transmission Error</p>
              <p className="text-xs text-red-200 mt-0.5">
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
              className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <IoPersonOutline
                  className={
                    focusedField === "name"
                      ? "text-secondary-400"
                      : "text-neutral-500"
                  }
                />
                Full Name
              </span>
              <span className="text-secondary-400 font-bold">*</span>
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                errors.name
                  ? "border-red-500/80 bg-red-950/20"
                  : focusedField === "name"
                  ? "border-secondary-500 ring-2 ring-secondary-500/25 bg-[#141414]"
                  : "border-neutral-800 bg-[#101010] hover:border-neutral-700"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
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
                className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
                required
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <IoMailOutline
                  className={
                    focusedField === "email"
                      ? "text-secondary-400"
                      : "text-neutral-500"
                  }
                />
                Email Address
              </span>
              <span className="text-secondary-400 font-bold">*</span>
            </label>
            <div
              className={`relative rounded-xl border transition-all duration-200 ${
                errors.email
                  ? "border-red-500/80 bg-red-950/20"
                  : focusedField === "email"
                  ? "border-secondary-500 ring-2 ring-secondary-500/25 bg-[#141414]"
                  : "border-neutral-800 bg-[#101010] hover:border-neutral-700"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
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
                className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="contact-subject"
            className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 mb-2 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <IoDocumentTextOutline
                className={
                  focusedField === "subject"
                    ? "text-secondary-400"
                    : "text-neutral-500"
                }
              />
              Subject / Topic
            </span>
            <span className="text-secondary-400 font-bold">*</span>
          </label>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              errors.subject
                ? "border-red-500/80 bg-red-950/20"
                : focusedField === "subject"
                ? "border-secondary-500 ring-2 ring-secondary-500/25 bg-[#141414]"
                : "border-neutral-800 bg-[#101010] hover:border-neutral-700"
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
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
              className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
              required
            />
          </div>
          {errors.subject && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="contact-message"
              className="text-[11px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-1.5"
            >
              <IoChatbubblesOutline
                className={
                  focusedField === "message"
                    ? "text-secondary-400"
                    : "text-neutral-500"
                }
              />
              Message Details
              <span className="text-secondary-400 font-bold">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                isMessageValid ? "text-secondary-400" : "text-neutral-500"
              }`}
            >
              {charCount} / 10 min characters
            </span>
          </div>
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              errors.message
                ? "border-red-500/80 bg-red-950/20"
                : focusedField === "message"
                ? "border-secondary-500 ring-2 ring-secondary-500/25 bg-[#141414]"
                : "border-neutral-800 bg-[#101010] hover:border-neutral-700"
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
              className="w-full px-4 py-3.5 bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none resize-none"
              required
            />
          </div>
          {errors.message && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full group overflow-hidden rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-secondary-500/20 hover:shadow-secondary-500/40"
          whileHover={!isSubmitting ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting ? { scale: 0.99 } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 via-secondary-500 to-[#ff7e36] transition-all duration-300 group-hover:opacity-95" />

          <div className="relative px-6 py-4 flex items-center justify-center gap-2.5 text-white">
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
                <IoArrowForward className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </div>
        </motion.button>
      </form>
    </SpotlightCard>
  );
};

export default ContactForm;
