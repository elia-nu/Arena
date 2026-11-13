import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ContactForm from "../components/contact/ContactForm";
import ContactInfo from "../components/contact/ContactInfo";
import {
  IoCallOutline,
  IoLocationOutline,
  IoFlashOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoArrowForward,
} from "react-icons/io5";
import { contactAPI } from "../services/api";
import InteractiveGridBackground from "../components/reactbits/InteractiveGridBackground";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import ShinyText from "../components/reactbits/ShinyText";
import DecryptedText from "../components/reactbits/DecryptedText";

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

  const highlights = [
    {
      id: "01",
      icon: IoFlashOutline,
      tag: "SPEED",
      title: "Rapid Turnaround",
      description: "Direct communications within 24 hours from our operations staff.",
    },
    {
      id: "02",
      icon: IoTrophyOutline,
      tag: "MATCHDAY",
      title: "Tournament Desk",
      description: "Dedicated roster and matchday assistance on competition weekends.",
    },
    {
      id: "03",
      icon: IoShieldCheckmarkOutline,
      tag: "COMMUNITY",
      title: "Civic & Brand Impact",
      description: "Partnering across Seattle to fund open youth clinics and pop-up pitches.",
    },
    {
      id: "04",
      icon: IoLocationOutline,
      tag: "PACIFIC NW",
      title: "Seattle, WA HQ",
      description: "Headquartered in Greater Seattle serving regional street soccer culture.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 sm:pt-28 md:pt-32 pb-20 relative overflow-hidden selection:bg-secondary-500 selection:text-white">
      {/* React Bits Interactive Canvas / Grid Background */}
      <InteractiveGridBackground
        gridSize={48}
        lineColor="rgba(255, 255, 255, 0.05)"
        glowColor="rgba(254, 87, 35, 0.16)"
        dotColor="rgba(254, 87, 35, 0.4)"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          {/* Decrypted Badge */}
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#111111] border border-secondary-500/30 shadow-lg shadow-secondary-500/10 mb-6"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
            </span>
            <DecryptedText
              text="// ARENA COMMUNICATIONS · SEATTLE WA"
              speed={35}
              maxIterations={14}
              className="text-xs font-mono font-bold tracking-widest text-secondary-400 uppercase"
            />
          </motion.div>

          {/* Main Title with React Bits ShinyText */}
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Get In{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-500 to-[#ff7e36]">
              <ShinyText text="Touch" speed={4.5} />
            </span>
            <span className="text-secondary-500">.</span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-neutral-300 font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Have questions about tournament registration, team rosters, merchandise,
            or brand partnerships? Send us a direct line and our Seattle operations
            crew will be with you promptly.
          </motion.p>
        </div>

        {/* 4 Spotlight Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 md:mb-16">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.08 }}
              >
                <SpotlightCard
                  className="bg-[#0a0a0a] border border-neutral-800 p-5 h-full flex flex-col justify-between hover:border-neutral-700 transition-colors"
                  spotlightColor="rgba(254, 87, 35, 0.18)"
                  glowRadius={320}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-[#121212] border border-neutral-800 flex items-center justify-center text-secondary-400">
                        <Icon className="text-xl" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-neutral-500 font-bold">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 font-bold uppercase">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>

        {/* Bento Grid: Form (Left) & Info Hub (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Contact Form Column */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <ContactForm />
          </motion.div>

          {/* Contact Details & Operations Column */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <ContactInfo />
          </motion.div>
        </div>

        {/* Bottom Banner: Urgent Matchday Assistance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <SpotlightCard
            className="bg-gradient-to-r from-[#0c0c0c] via-[#140d09] to-[#0c0c0c] border border-neutral-800 hover:border-secondary-500/50 p-8 sm:p-10 transition-colors"
            spotlightColor="rgba(254, 87, 35, 0.25)"
            glowRadius={450}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/10 border border-secondary-500/30 text-secondary-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  Live Matchday Field Desk
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Need Immediate On-Pitch Assistance?
                </h3>
                <p className="text-neutral-300 text-sm mt-2 leading-relaxed font-light">
                  During live weekend tournaments, skip the email queue and connect directly with
                  the Seattle operations field desk or visit the match coordination tent.
                </p>
                <div className="mt-3 text-xs font-mono text-neutral-500">
                  COORDINATES: 47.6062 N, 122.3321 W · GREATER SEATTLE REGION
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                <a
                  href={
                    contactInfo.phone
                      ? `tel:${contactInfo.phone.replace(/\s/g, "")}`
                      : "tel:12066786644"
                  }
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-secondary-500/25 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <IoCallOutline className="text-lg" />
                  Call Field Desk
                </a>

                <a
                  href="/events"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-white hover:text-secondary-400 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <span>Upcoming Fixtures</span>
                  <IoArrowForward className="text-base" />
                </a>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
