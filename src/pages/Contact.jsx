import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ContactForm from "../components/contact/ContactForm";
import ContactInfo from "../components/contact/ContactInfo";
import {
  IoChatbubblesOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { contactAPI } from "../services/api";

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({
    phone: "",
    email: "",
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await contactAPI.getInfo();
        if (data.contactInfo) {
          setContactInfo({
            phone: data.contactInfo.phone || "",
            email: data.contactInfo.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };

    fetchContactInfo();
  }, []);
  const features = [
    {
      icon: IoChatbubblesOutline,
      title: "Quick Response",
      description: "We typically respond within 24 hours",
      color: "from-secondary-500 to-secondary-400",
    },
    {
      icon: IoMailOutline,
      title: "Email Support",
      description: "Send us an email anytime",
      color: "from-secondary-600 to-secondary-500",
    },
    {
      icon: IoCallOutline,
      title: "Phone Support",
      description: "Call us during business hours",
      color: "from-secondary-700 to-secondary-600",
    },
    {
      icon: IoLocationOutline,
      title: "Seattle, WA",
      description: "Serving players & families across Greater Seattle",
      color: "from-secondary-500 to-secondary-400",
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 relative overflow-hidden">
      {/* SVG Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#d52f31", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#bb262b", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          {/* Abstract shapes */}
          <circle cx="200" cy="150" r="120" fill="url(#grad1)" opacity="0.4" />
          <circle cx="1200" cy="300" r="150" fill="url(#grad1)" opacity="0.3" />
          <circle cx="800" cy="700" r="100" fill="url(#grad1)" opacity="0.35" />
          <path
            d="M0,200 Q360,100 720,200 T1440,200"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="2"
            opacity="0.2"
          />
          <path
            d="M0,600 Q360,500 720,600 T1440,600"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="2"
            opacity="0.2"
          />
          {/* Grid pattern */}
          <g opacity="0.1">
            {Array.from({ length: 30 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 48}
                y1="0"
                x2={i * 48}
                y2="900"
                stroke="url(#grad1)"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 45}
                x2="1440"
                y2={i * 45}
                stroke="url(#grad1)"
                strokeWidth="1"
              />
            ))}
          </g>
          {/* Decorative dots */}
          {Array.from({ length: 50 }).map((_, i) => {
            const x = (i * 73) % 1440;
            const y = (i * 47) % 900;
            return (
              <circle
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill="url(#grad1)"
                opacity="0.15"
              />
            );
          })}
        </svg>
      </div>

      {/* Animated gradient blobs */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary-500 rounded-full blur-[200px] opacity-5"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-400 rounded-full blur-[180px] opacity-5"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary-500 to-secondary-400 flex items-center justify-center mx-auto shadow-lg">
              <IoChatbubblesOutline className="text-4xl text-primary-50" />
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-black-60 mb-6">
            Get In{" "}
            <span className="bg-secondary-700 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-primary-700 max-w-3xl mx-auto leading-relaxed">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white border-2 border-primary-200 rounded-2xl p-6 text-center hover:border-secondary-400 hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="text-2xl text-white" />
                </div>
                <h3 className="font-bold text-secondary-600 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-primary-600">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ContactForm />
          <ContactInfo />
        </div>

        {/* Additional Info Section */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-secondary-500/10 to-secondary-400/10 border-2 border-secondary-200 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-black text-secondary-600 mb-3">
              Need Immediate Assistance?
            </h3>
            <p className="text-primary-700 mb-4">
              For urgent matters, please call us directly or visit our office
              during business hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="px-6 py-3 bg-secondary-500 text-primary-50 font-bold rounded-xl hover:bg-secondary-600 transition-all flex items-center gap-2"
                >
                  <IoCallOutline className="text-xl" />
                  Call Now
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="px-6 py-3 bg-white border-2 border-secondary-500 text-secondary-600 font-bold rounded-xl hover:bg-secondary-50 transition-all flex items-center gap-2"
                >
                  <IoMailOutline className="text-xl" />
                  Email Us
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
