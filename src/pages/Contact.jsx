import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
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

const TICKER_ITEMS = [
  "Street Soccer",
  "Addis Ababa",
  "Hawassa",
  "The Arena",
  "Direct Desk",
  "Matchday Support",
  "Tournaments",
  "Youth Development",
  "Community Impact",
  "Rapid Turnaround",
  "Let Rumble",
];

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

  const stats = [
    {
      value: "< 24H",
      label: "Turnaround",
      sub: "Rapid Operations",
    },
    {
      value: "Addis Ababa",
      label: "Headquarters",
      sub: "Hawassa Hub",
    },
    {
      value: "Live Desk",
      label: "Matchday Ops",
      sub: "Weekend Support",
    },
    {
      value: "100%",
      label: "Community",
      sub: "Youth & Free Play",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-950 pt-28 sm:pt-32 md:pt-36 pb-24 relative overflow-hidden selection:bg-secondary-500 selection:text-white">
      {/* React Bits Interactive Light Grid Background with Warm Mouse Glow */}
      <InteractiveGridBackground
        theme="light"
        gridSize={48}
        lineColor="rgba(0, 0, 0, 0.04)"
        glowColor="rgba(254, 87, 35, 0.1)"
        dotColor="rgba(254, 87, 35, 0.45)"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Header Section with Watermark & Editorial Hero */}
        <div className="relative text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          {/* Watermark Outline Ghost Text (Inspired by THE ARENA Hero) */}
          <span
            className="absolute inset-x-0 -top-10 sm:-top-16 text-center font-black uppercase tracking-tighter select-none pointer-events-none text-transparent"
            style={{
              fontSize: "clamp(5rem, 19vw, 15rem)",
              WebkitTextStroke: "1.5px rgba(0, 0, 0, 0.04)",
              lineHeight: 0.9,
              zIndex: -1,
            }}
          >
            CONTACT
          </span>

          {/* Top Decrypted Pill Badge */}
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-neutral-200/90 shadow-sm mb-6"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
            </span>
            <DecryptedText
              text="THE ARENA // ETHIOPIA COMMUNICATIONS"
              speed={35}
              maxIterations={14}
              className="text-xs font-mono font-bold tracking-widest text-neutral-900 uppercase"
            />
          </motion.div>

          {/* Main Massive Title (Inspired by TH ARENA typography) */}
          <motion.h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-none mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-neutral-950">GET IN </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-[#ff6a28] to-[#ea580c]">
              <ShinyText text="TOUCH" speed={4.5} />
            </span>
            <span className="text-secondary-500">.</span>
          </motion.h1>

          {/* Sub-headline Tagline */}
          <motion.p
            className="text-secondary-600 text-xs sm:text-sm font-black tracking-[0.3em] uppercase mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ShinyText text="THE ARENA DIRECT OPERATIONS DESK" speed={5} className="text-secondary-600" />
          </motion.p>

          <motion.p
            className="text-base sm:text-lg text-neutral-600 font-light max-w-2xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Have questions about tournament registration, squad check-in, community grants,
            or brand sponsorships? Transmit your note directly to our Addis Ababa & Hawassa crew.
          </motion.p>

          {/* 4 Stat Badges (Directly Matching HeroSection StatPills) */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:shadow-md hover:border-secondary-500/50 transition-all duration-300 group cursor-default"
              >
                <p className="text-xl sm:text-2xl font-black text-neutral-950 font-mono tracking-tight group-hover:text-secondary-500 transition-colors">
                  {s.value}
                </p>
                <p className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-500 mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Athletic Running Marquee Ribbon */}
        <div className="mb-12 sm:mb-16 -mx-4 sm:mx-0 overflow-hidden rounded-2xl bg-neutral-950 py-3 border border-neutral-900 shadow-md">
          <Marquee speed={35} pauseOnHover={true} autoFill={true}>
            {TICKER_ITEMS.map((item, idx) => (
              <div key={idx} className="flex items-center mx-4 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 mr-4" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-white/90">
                  {item}
                </span>
              </div>
            ))}
          </Marquee>
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

        {/* Bottom Banner: Matchday Field Desk (Directly Matching Hero Promo Bar) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <SpotlightCard
            className="bg-neutral-950 text-white border border-neutral-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
            spotlightColor="rgba(254, 87, 35, 0.22)"
            glowRadius={450}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/15 border border-secondary-500/30 text-secondary-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  Live Matchday Field Desk
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Need Immediate On-Pitch Assistance?
                </h3>
                <p className="text-white/60 text-sm mt-2 leading-relaxed font-light">
                  During live weekend tournaments, skip the email queue and connect directly with
                  the operations field desk in Addis Ababa & Hawassa or visit the match coordination tent.
                </p>
                <div className="mt-3 text-xs font-mono text-white/40">
                  COORDINATES: 9.0192 N, 38.7525 E · ADDIS ABABA & HAWASSA, ETHIOPIA
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                <a
                  href={
                    contactInfo.phone
                      ? `tel:${contactInfo.phone.replace(/\s/g, "")}`
                      : "tel:+251911234567"
                  }
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-xl shadow-secondary-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <IoCallOutline className="text-base" />
                  Call Field Desk
                </a>

                <a
                  href="/events"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200"
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
