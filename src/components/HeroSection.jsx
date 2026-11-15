import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoFootball,
  IoTrophyOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoFlame,
  IoPlayOutline,
  IoFlashOutline,
  IoShieldCheckmarkOutline,
  IoChevronForward,
  IoClose,
} from "react-icons/io5";
import { tournamentAPI } from "../services/api";
import cannonImg from "../../public/cannon.png";
import SwarmCursor from "./reactbits/SwarmCursor";
import GridMotion from "./reactbits/GridMotion";

const GRID_MOTION_ITEMS = [
  // Row 1 — action / street play & 1,000 mini-stadiums
  "https://ebc.et/admin/news/2025/10/29/34ed59e2-0b51-403b-814b-d94b7695b4e0.jpg", // Addis Ababa 1,000 Mini-Stadiums
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&h=600&fit=crop", // ball kick close-up
  "THE ARENA",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop", // indoor futsal
  "STREET SOCCER",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop", // stadium night
  "ADDIS ABABA",
  // Row 2 — tournament / competition
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=600&fit=crop", // players dribbling
  "LETS RUMBLE",
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=600&fit=crop", // goalkeeper dive
  "CHAMPIONS",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=600&fit=crop", // jersey close-up
  // Row 3 — youth / community
  "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=800&h=600&fit=crop", // youth training
  "YOUTH SOCCER",
  "https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=800&h=600&fit=crop", // kids with ball
  "COMMUNITY IMPACT",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1600&auto=format&fit=crop", // aerial pitch
  // Row 4 — energy / celebration
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop", // team huddle
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=600&fit=crop", // goal celebration
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop", // crowd energy
  "REGISTER NOW",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop", // sprint duel
  "https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=800&h=600&fit=crop", // boots on turf
  "https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=800&h=600&fit=crop", // street football cage
  "https://images.unsplash.com/photo-1587253030000-e2b4e1b18e5b?w=800&h=600&fit=crop", // vibrant stadium lights
  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop", // referee & players
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

/* ─────────────────────────────────────────────
   DecryptedText — matrix-style reveal
───────────────────────────────────────────── */
const DecryptedText = ({ text = "", speed = 30, maxIterations = 12, delay = 0, className = "" }) => {
  const [display, setDisplay] = useState(text);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let iter = 0;
    const id = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((ch, idx) => {
            if (ch === " ") return " ";
            const progress = iter / maxIterations;
            const threshold = idx / text.length;
            return progress > threshold ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      iter++;
      if (iter > maxIterations + 4) {
        clearInterval(id);
        setDisplay(text);
      }
    }, speed);
    return () => clearInterval(id);
  }, [started, text, maxIterations, speed]);

  return <span className={className}>{display}</span>;
};

/* ─────────────────────────────────────────────
   PitchMarkings — Clean Pitch Geometry (No radial glow)
───────────────────────────────────────────── */
const PitchMarkings = () => (
  <div className="pointer-events-none absolute inset-0 z-[1] opacity-20 overflow-hidden flex items-center justify-center">
    <svg
      viewBox="0 0 1000 600"
      className="w-[140vw] max-w-none h-auto sm:w-[110%] opacity-40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer border */}
      <rect x="50" y="50" width="900" height="500" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Halfway line */}
      <line x1="500" y1="50" x2="500" y2="550" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="6 6" />
      {/* Center circle */}
      <circle cx="500" cy="300" r="110" fill="none" stroke="rgba(254,87,35,0.3)" strokeWidth="2" />
      <circle cx="500" cy="300" r="5" fill="#fe5723" />
      {/* Left penalty box */}
      <rect x="50" y="160" width="160" height="280" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      {/* Right penalty box */}
      <rect x="790" y="160" width="160" height="280" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────
   GunnerHeroEmblem — Authentic Arena Gunner Insignia
   Uses uploaded cannon (left) + flipped cannon (right)
   with live real text (rtext) in Poppins font
   (Clean flat rendering: no glows, no gradients)
───────────────────────────────────────────── */
const GunnerHeroEmblem = ({ mounted = false }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 8, ry: x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative select-none will-change-transform flex flex-col items-center justify-center my-3 sm:my-5 max-w-full group"
      style={{
        perspective: 1400,
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? `translateY(0px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : "translateY(24px) scale(0.96)",
        transition: "opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
      }}
    >
      {/* Target Radar Ring 1 */}
      <div
        className="absolute w-[320px] sm:w-[520px] md:w-[680px] h-[320px] sm:h-[520px] md:h-[680px] rounded-full border border-dashed border-secondary-500/20 pointer-events-none"
        style={{
          animation: "spin-slow 24s linear infinite",
          zIndex: 1,
        }}
      />

      {/* Target Radar Ring 2 (counter-rotating) */}
      <div
        className="absolute w-[240px] sm:w-[400px] md:w-[520px] h-[240px] sm:h-[400px] md:h-[520px] rounded-full border border-secondary-500/15 pointer-events-none"
        style={{
          animation: "spin-slow 18s linear infinite reverse",
          zIndex: 1,
        }}
      />

      {/* Background Watermark ARENA */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center uppercase tracking-wider select-none pointer-events-none"
        style={{
          fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
          fontSize: "clamp(4.5rem, 16vw, 14rem)",
          color: "rgba(255, 255, 255, 0.03)",
          lineHeight: 0.9,
          zIndex: 0,
        }}
      >
        ARENA
      </span>

      {/* ── THE EMBLEM COMPOSITION: Left Cannon + Real Text + Flipped Right Cannon ── */}
      <div className="relative z-10 flex items-center justify-center max-w-full px-1 sm:px-2">
        {/* ── Left Cannon (Original orientation pointing Up-Left, tucked tight to text) ── */}
        <div className="relative w-24 xs:w-32 sm:w-44 md:w-60 lg:w-72 xl:w-84 flex-shrink-0 -mr-2 sm:-mr-5 md:-mr-8 lg:-mr-10 z-0 group/left">
          <img
            src={cannonImg}
            alt="The Arena Cannon Left"
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        </div>

        {/* ── Center Live Real Text (Bigger, prominent, in Geometric Stencil Fonts) ── */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center select-none flex-shrink-0 px-1">
          <h1
            className="uppercase leading-none whitespace-nowrap"
            style={{
              fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
              fontSize: "clamp(2.4rem, 7.8vw, 7.2rem)",
              letterSpacing: "0.01em",
              lineHeight: 0.95,
            }}
          >
            <span className="text-white">THE</span>{" "}
            <span className="text-secondary-500">ARENA</span>
          </h1>

          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full mt-1.5 sm:mt-2.5">
            <span className="h-[1.5px] w-6 sm:w-12 md:w-16 bg-secondary-500/60" />
            <span
              className="uppercase text-secondary-400 whitespace-nowrap"
              style={{
                fontFamily: '"Big Shoulders Stencil Display", "Big Shoulders Stencil Text", sans-serif',
                fontSize: "clamp(0.95rem, 3vw, 2.25rem)",
                letterSpacing: "0.26em",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              LETS RUMBLE
            </span>
            <span className="h-[1.5px] w-6 sm:w-12 md:w-16 bg-secondary-500/60" />
          </div>
        </div>

        {/* ── Right Cannon (Flipped horizontally with scaleX(-1), tucked tight to text) ── */}
        <div className="relative w-24 xs:w-32 sm:w-44 md:w-60 lg:w-72 xl:w-84 flex-shrink-0 -ml-2 sm:-ml-5 md:-ml-8 lg:-ml-10 z-0 group/right">
          <img
            src={cannonImg}
            alt="The Arena Cannon Right"
            style={{ transform: "scaleX(-1)" }}
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Interactive Mode Switcher Tabs
───────────────────────────────────────────── */
const ARENA_PILLARS = [
  {
    id: "tournaments",
    title: "Street Tournaments",
    tagline: "High-voltage street football tournaments across Ethiopia's mini-stadiums.",
    icon: IoTrophyOutline,
    badge: "1,000 PITCHES",
  },
  {
    id: "futsal",
    title: "Fast-Paced Futsal & 5v5",
    tagline: "Uncompromising cage matches, flair, nutmegs, and precision technical play.",
    icon: IoFootball,
    badge: "CAGED ACTION",
  },
  {
    id: "community",
    title: "Youth & Community Impact",
    tagline: "Empowering next-generation ballers with direct access, coaching, and gear.",
    icon: IoPeopleOutline,
    badge: "GRASSROOTS",
  },
];

/* ─────────────────────────────────────────────
   HERO SECTION — Main Component
───────────────────────────────────────────── */
const HeroSection = () => {
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroMounted, setHeroMounted] = useState(false);
  const [activePillar, setActivePillar] = useState(ARENA_PILLARS[0].id);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Fetch upcoming tournament for live radar
  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedEvent = async () => {
      try {
        setLoading(true);
        const data = await tournamentAPI.getAll({ limit: 10 });
        if (!isMounted) return;
        const allTournaments = data?.tournaments || [];
        const now = new Date();
        const active = allTournaments.filter((t) => {
          const finished = t.status === "completed" || t.status === "cancelled";
          const ended = t.endDate && new Date(t.endDate) < now;
          return !finished && !ended;
        });
        const featured = active.filter((t) => t.isPromoted);
        const pool = featured.length > 0 ? featured : active;
        const sorted = pool.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        if (sorted.length > 0) {
          const e = sorted[0];
          setFeaturedEvent({
            id: e._id,
            type: e.type || "tournament",
            title: e.name,
            date: e.startDate,
            location: e.location || "Addis Ababa Mini-Stadiums",
            description:
              e.description ||
              "Compete, win, and dominate the field. Join hundreds of players in our premier championship.",
          });
        }
      } catch (err) {
        console.error("Failed to fetch featured event:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFeaturedEvent();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return "Coming Soon";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentPillar = ARENA_PILLARS.find((p) => p.id === activePillar) || ARENA_PILLARS[0];

  const battleTapeItems = [
    "STREET SOCCER",
    "ADDIS ABABA",
    "1,000 MINI-STADIUMS",
    "LETS RUMBLE",
    "HAWASSA",
    "CHAMPIONS REIGN",
    "YOUTH DEVELOPMENT",
    "5V5 CAGED ARENA",
    "PANNA & FLAIR",
    "REGISTER YOUR SQUAD",
  ];

  return (
    <SwarmCursor
      className="w-full min-h-screen bg-black"
      count={260}
      size={2.5}
      color="#fe5723"
      accentColor="#ffffff"
      spread={80}
      speed={1.05}
      swirl={0.5}
      tail={0.4}
      trail={0.55}
      clickEffect="burst"
      targets="a, button, [data-swarm-target]"
    >
      <div className="relative w-full min-h-screen flex flex-col justify-between items-center bg-black overflow-hidden selection:bg-secondary-500 selection:text-white">
        {/* ── Layer 0: GridMotion Interactive Kinetic Grid ── */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <GridMotion
            items={GRID_MOTION_ITEMS}
            rows={5}
            aspectRatio={1.5}
            gap={16}
            radius={16}
            angle={-9}
            tilt={10}
            speed={20}
            direction="alternate"
            parallax={0.35}
            spotlight={0.6}
            dim={0.4}
            fade={0.65}
            theme="dark"
            tileColor="#131215"
            textColor="#fe5723"
          />
        </div>

        {/* ── Layer 1: Clean Dark Atmosphere ── */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-black/60">
          {/* Top backdrop for navbar contrast */}
          <div className="absolute inset-x-0 top-0 h-40 bg-black/80" />
          {/* Bottom backdrop for panel separation */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-black/85" />
        </div>

        {/* ── Layer 2: Pitch Geometry Markings ── */}
        <PitchMarkings />

        {/* ── MAIN CONTENT (clears the floating navbar with pt-24 sm:pt-28 md:pt-32) ── */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 flex-grow justify-center">
          {/* ── TOP TACTICAL BADGE ── */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-2 sm:mb-3"
          >
            <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-secondary-500/40 bg-neutral-950/90">
              <span className="w-2 h-2 rounded-full bg-secondary-500" />
              <DecryptedText
                text="ETHIOPIA'S PREMIER STREET SOCCER CIRCUIT"
                speed={26}
                maxIterations={12}
                delay={200}
                className="text-white text-[10px] sm:text-xs font-black tracking-[0.22em] uppercase"
              />
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-secondary-400" />
              <span className="hidden sm:inline-block text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                1,000 MINI-STADIUMS
              </span>
            </div>
          </motion.div>

          {/* ── THE AUTHENTIC GUNNER CENTERPIECE (CANNONS FLANKING REAL TEXT) ── */}
          <GunnerHeroEmblem mounted={heroMounted} />

          {/* ── Slogan & Kinetic Slogan Strip (Solid flat text) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col items-center mt-1 sm:mt-2 mb-3"
          >
            <p className="text-secondary-400 text-xs sm:text-sm font-black tracking-[0.3em] uppercase flex items-center gap-2">
              <IoFlame className="w-4 h-4 text-secondary-500" />
              <span>THE GAME PLAN IS TO HAVE FUN & WIN</span>
              <IoFlame className="w-4 h-4 text-secondary-500" />
            </p>
          </motion.div>

          {/* ── Dynamic Pillar Switcher: Interactive Mode selector (Solid Flat) ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-1.5 sm:gap-2 my-2 sm:my-3 max-w-2xl mx-auto p-1 rounded-xl bg-white/[0.04] border border-white/10"
          >
            {ARENA_PILLARS.map((pillar) => {
              const active = activePillar === pillar.id;
              const IconComponent = pillar.icon;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActivePillar(pillar.id)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 select-none ${
                    active
                      ? "text-white bg-secondary-500"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <IconComponent className="relative z-10 w-3.5 h-3.5" />
                  <span className="relative z-10">{pillar.title}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Dynamic Sub-Headline based on active pillar */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPillar.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-white/70 text-xs sm:text-base max-w-xl mx-auto font-normal leading-relaxed mb-6 sm:mb-7 px-4 min-h-[44px]"
            >
              {currentPillar.tagline}
            </motion.p>
          </AnimatePresence>

          {/* ── High-Impact Action Buttons (Flat Solid Colors) ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10"
          >
            {/* Primary CTA Button */}
            <Link
              to="/events"
              className="px-7 py-3.5 sm:px-9 sm:py-4 font-black text-white text-xs sm:text-sm rounded-full bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200 tracking-widest uppercase flex items-center gap-2"
            >
              <IoFlashOutline className="w-4 h-4 text-white" />
              <span>Enter The Arena</span>
              <IoChevronForward className="w-4 h-4" />
            </Link>

            {/* Video / Trailer Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white text-xs sm:text-sm font-bold rounded-full transition-colors duration-200 tracking-widest uppercase"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-500/30 border border-secondary-500/50">
                <IoPlayOutline className="w-3 h-3 text-secondary-400 translate-x-0.2" />
              </span>
              <span>Watch Arena Reel</span>
            </button>
          </motion.div>

          {/* ── Interactive Athletic Stat HUD ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto w-full"
          >
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-secondary-500/40 hover:bg-white/[0.07] transition-colors duration-200 group">
              <span className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none group-hover:text-secondary-400 transition-colors">
                <IoFootball className="w-5 h-5 text-secondary-500" />
                500+
              </span>
              <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-widest uppercase mt-1">
                Youth Ballers
              </span>
            </div>

            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-secondary-500/40 hover:bg-white/[0.07] transition-colors duration-200 group">
              <span className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none group-hover:text-secondary-400 transition-colors">
                <IoLocationOutline className="w-5 h-5 text-secondary-500" />
                1,000
              </span>
              <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-widest uppercase mt-1">
                Mini-Stadiums
              </span>
            </div>

            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-secondary-500/40 hover:bg-white/[0.07] transition-colors duration-200 group">
              <span className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none group-hover:text-secondary-400 transition-colors">
                <IoTrophyOutline className="w-5 h-5 text-secondary-500" />
                12+
              </span>
              <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-widest uppercase mt-1">
                Championships
              </span>
            </div>

            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-secondary-500/40 hover:bg-white/[0.07] transition-colors duration-200 group">
              <span className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black text-white tracking-tight leading-none group-hover:text-secondary-400 transition-colors">
                <IoPeopleOutline className="w-5 h-5 text-secondary-500" />
                100%
              </span>
              <span className="text-[10px] sm:text-xs text-white/50 font-bold tracking-widest uppercase mt-1">
                Community Driven
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM TACTICAL RADAR PANEL ── */}
        <div className="relative z-30 w-full mt-auto">
          {/* Battle-Tape Strip Marquee (Flat) */}
          <div className="border-t border-b border-secondary-500/30 bg-secondary-500/10 py-2 overflow-hidden select-none">
            <div
              className="flex whitespace-nowrap will-change-transform"
              style={{ animation: "ticker-scroll 24s linear infinite" }}
            >
              {[...battleTapeItems, ...battleTapeItems, ...battleTapeItems].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-4 text-white/70 text-xs font-black tracking-[0.25em] uppercase px-5 group"
                >
                  <span className="w-1.5 h-1.5 rotate-45 bg-secondary-500 flex-shrink-0" />
                  <span className="hover:text-secondary-400 transition-colors">{item}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Next Rumble Spotlight HUD Card (Flat) */}
          <div className="border-t border-white/10 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
            {loading ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
                <div className="flex gap-3 items-center">
                  <div className="h-4 bg-white/10 rounded-full w-24 animate-pulse" />
                  <div className="h-5 bg-white/10 rounded-full w-48 animate-pulse" />
                </div>
                <div className="h-4 bg-white/10 rounded-full w-80 animate-pulse" />
                <div className="h-9 bg-secondary-500/20 rounded-full w-32 animate-pulse" />
              </div>
            ) : featuredEvent ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-center md:text-left">
                {/* Event Title & Status */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary-500/20 border border-secondary-500/50 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-400" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <p className="text-secondary-400 text-[10px] font-black tracking-[0.25em] uppercase">
                        NEXT RUMBLE RADAR
                      </p>
                      <span className="px-1.5 py-0.2 rounded bg-secondary-500/20 text-secondary-400 border border-secondary-500/40 text-[9px] font-black uppercase">
                        OPEN
                      </span>
                    </div>
                    <p className="text-white text-sm sm:text-base font-black leading-tight mt-0.5">
                      {featuredEvent.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5 justify-center md:justify-start">
                      <span className="flex items-center gap-1">
                        <IoTimeOutline className="w-3.5 h-3.5 text-secondary-400" />
                        {formatDate(featuredEvent.date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <IoLocationOutline className="w-3.5 h-3.5 text-secondary-400" />
                        {featuredEvent.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center Description */}
                <p className="hidden lg:block text-white/50 text-xs sm:text-sm max-w-md line-clamp-2">
                  {featuredEvent.description}
                </p>

                {/* Instant Registration Action */}
                <Link
                  to={`/events/${featuredEvent.type || "tournament"}/${featuredEvent.id}`}
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-secondary-500 bg-secondary-500 hover:bg-secondary-600 text-white font-black text-xs tracking-widest uppercase transition-colors duration-200 flex-shrink-0"
                >
                  <IoFlame className="w-3.5 h-3.5" />
                  Lock In Squad
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-center md:text-left">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15 flex-shrink-0">
                    <IoShieldCheckmarkOutline className="w-4 h-4 text-secondary-400" />
                  </span>
                  <div>
                    <p className="text-secondary-400 text-[10px] font-black tracking-[0.25em] uppercase">
                      COMMUNITY IMPACT // 2026
                    </p>
                    <p className="text-white text-sm sm:text-base font-black">
                      Summer &apos;26 Grassroots Tournament Series
                    </p>
                  </div>
                </div>
                <p className="text-white/50 text-xs sm:text-sm max-w-md">
                  7 community partnerships, over 500 youth players engaged, and championship moments celebrated across Addis Ababa and Hawassa.
                </p>
                <Link
                  to="/community-impact"
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/40 font-bold text-xs tracking-widest uppercase transition-colors duration-200 flex-shrink-0"
                >
                  Explore Impact
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Video Reel Modal ── */}
        <AnimatePresence>
          {isVideoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
              onClick={() => setIsVideoModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-4xl bg-neutral-950 rounded-2xl border border-secondary-500/30 overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                      THE ARENA // OFFICIAL HYPE REEL
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>

                {/* Video Container */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <div className="text-center p-8">
                    <IoFootball className="w-16 h-16 text-secondary-500 mx-auto mb-4" />
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                      LETS RUMBLE // STREET SOCCER ETHIOPIA
                    </h3>
                    <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
                      Witness the intensity of street soccer across 1,000 mini-stadiums in Addis Ababa & Hawassa.
                    </p>
                    <Link
                      to="/gallery"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-secondary-600 transition-colors"
                    >
                      Browse Match Gallery →
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Keyframes */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
        `}</style>
      </div>
    </SwarmCursor>
  );
};

export default HeroSection;
