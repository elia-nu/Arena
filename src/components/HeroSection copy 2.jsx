import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoFootball,
  IoTrophyOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoPlayOutline,
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
  "https://ebc.et/admin/news/2025/10/29/34ed59e2-0b51-403b-814b-d94b7695b4e0.jpg",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&h=600&fit=crop",
  "THE ARENA",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
  "STREET SOCCER",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
  "ADDIS ABABA",
  // Row 2 — tournament / competition
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=600&fit=crop",
  "LETS RUMBLE",
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=600&fit=crop",
  "CHAMPIONS",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=600&fit=crop",
  // Row 3 — youth / community
  "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=800&h=600&fit=crop",
  "YOUTH SOCCER",
  "https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=800&h=600&fit=crop",
  "COMMUNITY IMPACT",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1600&auto=format&fit=crop",
  // Row 4 — energy / celebration
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
  "REGISTER NOW",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1587253030000-e2b4e1b18e5b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop",
];

/* ─────────────────────────────────────────────
   PitchMarkings — Quiet Pitch Geometry
───────────────────────────────────────────── */
const PitchMarkings = () => (
  <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden flex items-center justify-center opacity-25">
    <svg
      viewBox="0 0 1000 600"
      className="w-[130vw] max-w-none h-auto sm:w-[110%]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="50"
        y="50"
        width="900"
        height="500"
        rx="8"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <line
        x1="500"
        y1="50"
        x2="500"
        y2="550"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <circle
        cx="500"
        cy="300"
        r="110"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <circle cx="500" cy="300" r="3" fill="rgba(254,87,35,0.85)" />
      <rect
        x="50"
        y="160"
        width="150"
        height="280"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      <rect
        x="800"
        y="160"
        width="150"
        height="280"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────
   GunnerHeroEmblem — Authentic Arena Insignia
   Composed with live stencil typography + cannons
───────────────────────────────────────────── */
const GunnerHeroEmblem = () => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 5, ry: x * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative select-none flex flex-col items-center justify-center my-2 sm:my-3 max-w-2xl sm:max-w-3xl mx-auto w-full"
      style={{
        perspective: 1200,
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.2s ease-out",
      }}
    >
      {/* Atmospheric Soft Orange Glow behind Emblem */}
      <div
        className="absolute w-[80%] h-[75%] rounded-full blur-[50px] sm:blur-[80px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(254, 87, 35, 0.24) 0%, rgba(255, 107, 43, 0.06) 50%, transparent 75%)",
        }}
      />

      <div className="relative flex flex-col items-center justify-center text-center px-4">
        {/* Top: THE */}
        <span
          className="uppercase select-none text-secondary-500 font-black tracking-wider block"
          style={{
            fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
            fontSize: "clamp(1.4rem, 4.2vw, 3.2rem)",
            lineHeight: 0.9,
            letterSpacing: "0.06em",
          }}
        >
          THE
        </span>

        {/* Center Row: ARENA + Left & Right Overlapping Cannons */}
        <div className="relative flex items-center justify-center">
          {/* Left Cannon (overlapping left 'A' & 'R') */}
          <div
            className="absolute left-0 top-1/2 -translate-y-[44%] -translate-x-[26%] sm:-translate-x-[30%] z-20 pointer-events-none w-[34%] sm:w-[36%] max-w-[210px]"
          >
            <img
              src={cannonImg}
              alt="The Arena Cannon"
              className="w-full h-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </div>

          {/* Main "ARENA" Live Stencil Heading */}
          <h1
            className="relative z-10 uppercase text-secondary-500 font-black leading-none select-none px-4 sm:px-8 md:px-10 whitespace-nowrap"
            style={{
              fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
              fontSize: "clamp(2.8rem, 8.5vw, 6.8rem)",
              lineHeight: 0.88,
              letterSpacing: "0.02em",
            }}
          >
            ARENA
          </h1>

          {/* Right Cannon (Mirrored, overlapping right 'A' & 'N') */}
          <div
            className="absolute right-0 top-1/2 -translate-y-[44%] translate-x-[26%] sm:translate-x-[30%] z-20 pointer-events-none w-[34%] sm:w-[36%] max-w-[210px]"
          >
            <img
              src={cannonImg}
              alt="The Arena Cannon"
              style={{ transform: "scaleX(-1)" }}
              className="w-full h-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Bottom: LETS RUMBLE */}
        <span
          className="uppercase select-none text-secondary-500 font-black tracking-widest mt-1 sm:mt-1.5 block"
          style={{
            fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
            fontSize: "clamp(0.85rem, 2.3vw, 1.75rem)",
            letterSpacing: "0.22em",
            lineHeight: 1,
          }}
        >
          LETS RUMBLE
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Pillar Modes
───────────────────────────────────────────── */
const ARENA_PILLARS = [
  {
    id: "tournaments",
    title: "Street Tournaments",
    tagline: "Competitive street football championships hosted across Ethiopia's 1,000 mini-stadiums.",
    icon: IoTrophyOutline,
  },
  {
    id: "futsal",
    title: "5v5 Cage Football",
    tagline: "High-intensity cage fixtures built on technical precision, flair, and rapid transitions.",
    icon: IoFootball,
  },
  {
    id: "community",
    title: "Youth Impact",
    tagline: "Grassroots development connecting emerging players to tournament access, coaching, and gear.",
    icon: IoPeopleOutline,
  },
];

/* ─────────────────────────────────────────────
   HERO SECTION — With Kinetic Grid & Swarm Cursor
───────────────────────────────────────────── */
const HeroSection = () => {
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePillar, setActivePillar] = useState(ARENA_PILLARS[0].id);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
              "Compete and represent your neighborhood in Ethiopia's premier street football championship.",
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
    if (!d) return "Date to be announced";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const currentPillar = ARENA_PILLARS.find((p) => p.id === activePillar) || ARENA_PILLARS[0];

  return (
    <SwarmCursor
      className="w-full min-h-screen bg-black"
      count={160}
      size={2}
      color="#fe5723"
      accentColor="#ffffff"
      spread={70}
      speed={1.0}
      swirl={0.4}
      tail={0.35}
      trail={0.5}
      clickEffect="burst"
      targets="a, button, [data-swarm-target]"
    >
      <section className="relative w-full min-h-screen flex flex-col justify-between bg-[#0e0f12] text-neutral-200 overflow-hidden selection:bg-secondary-500 selection:text-white">
        {/* Layer 0: GridMotion Kinetic Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <GridMotion
            items={GRID_MOTION_ITEMS}
            rows={5}
            aspectRatio={1.5}
            gap={16}
            radius={14}
            angle={-8}
            tilt={8}
            speed={18}
            direction="alternate"
            parallax={0.3}
            spotlight={0.65}
            dim={0.25}
            fade={0.45}
            theme="dark"
            tileColor="#131215"
            textColor="#fe5723"
          />
        </div>

        {/* Layer 1: Contrast Vignette Backdrops */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-black/40">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Layer 2: Pitch Markings */}
        <PitchMarkings />

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-12 flex flex-col items-center text-center flex-grow justify-center">
          {/* Top Quiet Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/90 text-xs text-neutral-300 mb-2 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
            <span>Addis Ababa Street Football</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">1,000 Mini-stadiums</span>
          </div>

          {/* Central Authentic Emblem */}
          <GunnerHeroEmblem />

          {/* Clear Proposition */}
          <p className="text-sm sm:text-base font-semibold text-neutral-300 uppercase tracking-widest mt-1 mb-4">
            Ethiopia&apos;s Street Soccer & Futsal Circuit
          </p>

          {/* Pillar Switcher */}
          <div className="flex flex-wrap justify-center gap-1.5 my-3 max-w-xl mx-auto p-1 rounded-lg bg-neutral-900/90 border border-neutral-800 backdrop-blur-xs">
            {ARENA_PILLARS.map((pillar) => {
              const active = activePillar === pillar.id;
              const IconComponent = pillar.icon;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActivePillar(pillar.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                    active
                      ? "bg-neutral-800 text-neutral-100 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{pillar.title}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tagline */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPillar.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-6 px-4 min-h-[48px]"
            >
              {currentPillar.tagline}
            </motion.p>
          </AnimatePresence>

          {/* Action Pair */}
          <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
            <Link
              to="/events"
              className="h-11 px-6 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 inline-flex items-center gap-2"
            >
              <span>Explore Tournaments</span>
              <IoChevronForward className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="h-11 px-5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-200 text-xs font-medium uppercase tracking-wider transition-colors duration-150 inline-flex items-center gap-2 backdrop-blur-xs"
            >
              <IoPlayOutline className="w-4 h-4 text-neutral-400" />
              <span>Watch Highlight Reel</span>
            </button>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto w-full">
            <div className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/70 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-100 tabular-nums">500+</span>
              <span className="text-xs text-neutral-400 mt-1">Youth players</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/70 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-100 tabular-nums">1,000</span>
              <span className="text-xs text-neutral-400 mt-1">Mini-stadiums</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/70 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-100 tabular-nums">12+</span>
              <span className="text-xs text-neutral-400 mt-1">Championships</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/70 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-100 tabular-nums">100%</span>
              <span className="text-xs text-neutral-400 mt-1">Community driven</span>
            </div>
          </div>
        </div>

        {/* Bottom Tournament Status Card */}
        <div className="relative z-20 w-full border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-between max-w-5xl mx-auto text-xs text-neutral-500">
              <span>Loading upcoming fixtures...</span>
            </div>
          ) : featuredEvent ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto text-center md:text-left">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-secondary-500 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Next Tournament
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
                      Registration open
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-100 mt-0.5">
                    {featuredEvent.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5 justify-center md:justify-start">
                    <span className="inline-flex items-center gap-1">
                      <IoTimeOutline className="w-3.5 h-3.5 text-neutral-500" />
                      {formatDate(featuredEvent.date)}
                    </span>
                    <span className="text-neutral-600">·</span>
                    <span className="inline-flex items-center gap-1">
                      <IoLocationOutline className="w-3.5 h-3.5 text-neutral-500" />
                      {featuredEvent.location}
                    </span>
                  </div>
                </div>
              </div>

              <p className="hidden lg:block text-neutral-400 text-xs max-w-md line-clamp-2">
                {featuredEvent.description}
              </p>

              <Link
                to={`/events/${featuredEvent.type || "tournament"}/${featuredEvent.id}`}
                className="h-9 px-4 rounded-md bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Register Squad</span>
                <IoChevronForward className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto text-center md:text-left">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-neutral-600 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Community Impact
                  </p>
                  <p className="text-sm font-semibold text-neutral-100 mt-0.5">
                    Grassroots Tournament Series
                  </p>
                </div>
              </div>
              <p className="text-neutral-400 text-xs max-w-md">
                Active community partnerships across Addis Ababa and Hawassa mini-stadiums.
              </p>
              <Link
                to="/community-impact"
                className="h-9 px-4 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium uppercase tracking-wider transition-colors duration-150 inline-flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Explore Impact</span>
                <IoChevronForward className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Video Modal */}
        <AnimatePresence>
          {isVideoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsVideoModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-3xl bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                      The Arena Highlight Reel
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  >
                    <IoClose className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative aspect-video bg-neutral-950 flex items-center justify-center p-8 text-center">
                  <div>
                    <IoFootball className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-neutral-100 mb-1">
                      Street Soccer & Mini-Stadium Highlights
                    </h3>
                    <p className="text-neutral-400 text-xs max-w-sm mx-auto mb-5">
                      Match footage from community cage matches and grassroots tournaments in Addis Ababa.
                    </p>
                    <Link
                      to="/gallery"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
                    >
                      <span>Browse Match Gallery</span>
                      <IoChevronForward className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </SwarmCursor>
  );
};

export default HeroSection;
