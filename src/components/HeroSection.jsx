import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { tournamentAPI } from "../services/api";
import logo from "../../public/logo.jpg";
import gunnerLogo from "../../public/arena-gunner-transparent.png";
import SwarmCursor from "./reactbits/SwarmCursor";
import GridMotion from "./reactbits/GridMotion";

const GRID_MOTION_ITEMS = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
  "THE ARENA",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
  "STREET SOCCER",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
  "SEATTLE",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=600&fit=crop",
  "LETS RUMBLE",
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=600&fit=crop",
  "CHAMPIONS",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=600&fit=crop",
  "YOUTH SOCCER",
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&h=600&fit=crop",
  "COMMUNITY IMPACT",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
];

/* ─────────────────────────────────────────────
   SplitText — animates each word in on mount
───────────────────────────────────────────── */
const SplitText = ({ text, className = "", delay = 0, stagger = 60 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span aria-label={text} className="inline-flex flex-wrap gap-x-[0.22em]">
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-700 ease-out will-change-transform ${className}`}
          style={{
            transitionDelay: `${i * stagger}ms`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(32px)",
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
};

/* ─────────────────────────────────────────────
   ShinyText — shimmer sweep effect
───────────────────────────────────────────── */
const ShinyText = ({ text, speed = 4, className = "" }) => (
  <span
    className={`inline-block relative overflow-hidden select-none ${className}`}
    style={{
      backgroundImage: `linear-gradient(120deg, currentColor 0%, currentColor 38%, rgba(255,255,255,0.95) 50%, currentColor 62%, currentColor 100%)`,
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      animation: `shiny-hero ${speed}s ease-in-out infinite`,
    }}
  >
    {text}
    <style>{`
      @keyframes shiny-hero {
        0%   { background-position: 150% 0; }
        100% { background-position: -150% 0; }
      }
    `}</style>
  </span>
);

/* ─────────────────────────────────────────────
   DecryptedText — matrix-style reveal
───────────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
const DecryptedText = ({ text = "", speed = 35, maxIterations = 14, delay = 0, className = "" }) => {
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
        text.split("").map((ch, idx) => {
          if (ch === " ") return " ";
          const progress = iter / maxIterations;
          const threshold = idx / text.length;
          return progress > threshold ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      iter++;
      if (iter > maxIterations + 4) {
        clearInterval(id);
        setDisplay(text);
      }
    }, speed);
    return () => clearInterval(id);
  }, [started, text]);

  return <span className={className}>{display}</span>;
};

/* ─────────────────────────────────────────────
   MouseGlow — full-section cursor radial glow
───────────────────────────────────────────── */
const MouseGlow = () => {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
      style={{
        background: `radial-gradient(700px circle at ${pos.x}px ${pos.y}px, rgba(254,87,35,0.09), transparent 75%)`,
      }}
    />
  );
};

/* ─────────────────────────────────────────────
   NoiseOverlay — cinematic grain texture
───────────────────────────────────────────── */
const NoiseOverlay = () => (
  <div
    className="pointer-events-none absolute inset-0 z-10 opacity-[0.032]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    }}
  />
);

/* ─────────────────────────────────────────────
   StatPill — animated counter badge
───────────────────────────────────────────── */
const StatPill = ({ value, label, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="flex flex-col items-center px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-700"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(16px)",
      }}
    >
      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
        {value}
      </span>
      <span className="text-[10px] sm:text-xs text-white/40 font-semibold tracking-widest uppercase mt-1">
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ScrambleButton — text scrambles on hover
───────────────────────────────────────────── */
const ScrambleButton = ({ children, to, className = "", style }) => {
  const [text, setText] = useState(children);
  const original = useRef(children);
  const rafRef = useRef(null);

  const scramble = () => {
    let iter = 0;
    const src = original.current;
    if (rafRef.current) clearInterval(rafRef.current);
    rafRef.current = setInterval(() => {
      setText(
        src.split("").map((ch, idx) => {
          if (ch === " " || ch === "→") return ch;
          return iter / 10 > idx / src.length
            ? ch
            : CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      iter++;
      if (iter > src.length * 1.5) {
        clearInterval(rafRef.current);
        setText(src);
      }
    }, 28);
  };

  return (
    <Link to={to} className={className} style={style} onMouseEnter={scramble}>
      {text}
    </Link>
  );
};

/* ─────────────────────────────────────────────
   TickerTrack — infinite scrolling marquee
───────────────────────────────────────────── */
const TickerTrack = ({ items }) => (
  <div className="relative overflow-hidden w-full">
    <div className="flex whitespace-nowrap" style={{ animation: "ticker-scroll 28s linear infinite" }}>
      {[...items, ...items].map((item, i) => (
        <span key={i} className="inline-flex items-center gap-3 text-white/35 text-xs font-semibold tracking-widest uppercase px-6">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 flex-shrink-0" />
          {item}
        </span>
      ))}
    </div>
    <style>{`
      @keyframes ticker-scroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────────
   GunnerHeroEmblem — Authentic Arena Gunner Insignia
   Interactive 3D tilt, muzzle glow flares, and ambient bloom
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
      className="relative select-none will-change-transform flex flex-col items-center justify-center my-1 sm:my-2 max-w-full"
      style={{
        perspective: 1200,
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? `translateY(0px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : "translateY(24px) scale(0.96)",
        transition: "opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
      }}
    >
      {/* Background Watermark Ghost behind gunners */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-black uppercase tracking-tighter select-none pointer-events-none"
        style={{
          fontSize: "clamp(4.5rem, 16vw, 14rem)",
          color: "transparent",
          WebkitTextStroke: "1px rgba(254, 87, 35, 0.08)",
          lineHeight: 1,
          zIndex: 0,
        }}
      >
        ARENA
      </span>

      {/* Atmospheric center glow behind emblem */}
      <div
        className="absolute w-[85%] h-[75%] rounded-full blur-[70px] sm:blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(254, 87, 35, 0.28) 0%, rgba(255, 139, 66, 0.12) 45%, transparent 75%)",
          zIndex: 1,
        }}
      />

      {/* The Authentic Gunner Artwork */}
      <div className="relative z-10 w-[270px] xs:w-[320px] sm:w-[440px] md:w-[540px] lg:w-[620px] xl:w-[680px] max-w-[92vw] group">
        <img
          src={gunnerLogo}
          alt="The Arena - Gunners - Lets Rumble"
          className="w-full h-auto object-contain drop-shadow-[0_8px_30px_rgba(254,87,35,0.45)] transition-transform duration-500 group-hover:scale-[1.02]"
          draggable={false}
        />

        {/* Left Cannon Muzzle Flash & Flare */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "4.5%",
            top: "43%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="relative flex h-2.5 w-2.5 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-60" />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4"
              style={{
                background: "radial-gradient(circle, #fff 0%, #ff8b42 40%, #fe5723 100%)",
                boxShadow: "0 0 14px #fe5723, 0 0 25px #ff8b42",
              }}
            />
          </span>
          {/* Subtle muzzle blast light aura */}
          <div
            className="absolute -inset-3 sm:-inset-5 rounded-full blur-md opacity-70 animate-pulse pointer-events-none"
            style={{ background: "radial-gradient(circle, #fe5723 0%, transparent 70%)" }}
          />
        </div>

        {/* Right Cannon Muzzle Flash & Flare */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "4.5%",
            top: "43%",
            transform: "translate(50%, -50%)",
          }}
        >
          <span className="relative flex h-2.5 w-2.5 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-60" />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-4 sm:w-4"
              style={{
                background: "radial-gradient(circle, #fff 0%, #ff8b42 40%, #fe5723 100%)",
                boxShadow: "0 0 14px #fe5723, 0 0 25px #ff8b42",
              }}
            />
          </span>
          {/* Subtle muzzle blast light aura */}
          <div
            className="absolute -inset-3 sm:-inset-5 rounded-full blur-md opacity-70 animate-pulse pointer-events-none"
            style={{ background: "radial-gradient(circle, #fe5723 0%, transparent 70%)" }}
          />
        </div>
      </div>

      {/* Visually hidden H1 for SEO and Screen Readers */}
      <h1 className="sr-only">THE ARENA - LETS RUMBLE</h1>
    </div>
  );
};

/* ─────────────────────────────────────────────
   HERO SECTION — main export
───────────────────────────────────────────── */
const HeroSection = () => {
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroMounted, setHeroMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        setLoading(true);
        const data = await tournamentAPI.getAll({ limit: 10 });
        const allTournaments = data.tournaments || [];
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
            description: e.description || "Compete, win, and dominate the field. Join hundreds of players in our biggest event yet.",
          });
        }
      } catch (err) {
        console.error("Failed to fetch featured event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedEvent();
  }, []);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const tickerItems = [
    "Street Soccer", "Seattle", "Youth Development", "Community Impact",
    "Tournaments", "Champions", "Register Now", "The Arena",
  ];

  return (
    <SwarmCursor
      className="w-full min-h-screen bg-black"
      count={700}
      size={2.6}
      color="#fe5723"
      accentColor="#ffffff"
      spread={90}
      speed={1.1}
      swirl={0.6}
      tail={0.5}
      trail={0.6}
      clickEffect="burst"
      targets="a, button, [data-swarm-target]"
    >
      <div className="relative w-full min-h-screen flex flex-col justify-between items-center bg-black overflow-hidden">

      {/* ── Layer 0: GridMotion Background Wall ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <GridMotion
          items={GRID_MOTION_ITEMS}
          rows={4}
          aspectRatio={1.5}
          gap={18}
          radius={16}
          angle={-10}
          tilt={12}
          speed={20}
          direction="alternate"
          parallax={0.4}
          spotlight={0.65}
          dim={0.45}
          fade={0.6}
          theme="dark"
          tileColor="#141316"
          textColor="#fe5723"
        />
      </div>

      {/* ── Layer 1: Gradient atmosphere ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Deep vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 10%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.92) 100%)"
        }} />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
        {/* Bottom heavy fade */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent" />
        {/* Ambient orange bloom — left */}
        <div
          className="absolute -top-20 -left-40 w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: "radial-gradient(circle, rgba(254,87,35,0.18) 0%, transparent 70%)", animation: "pulse-bloom 8s ease-in-out infinite" }}
        />
        {/* Ambient orange bloom — right */}
        <div
          className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: "radial-gradient(circle, rgba(255,139,66,0.12) 0%, transparent 70%)", animation: "pulse-bloom 11s ease-in-out infinite reverse" }}
        />
      </div>

      {/* ── Layer 2: Grid pattern ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ opacity: 0.3 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.2" fill="rgba(254,87,35,0.25)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* ── Layer 3: Interactive mouse glow ── */}
      <MouseGlow />

      {/* ── Layer 4: Noise/grain ── */}
      <NoiseOverlay />

      {/* ── Floating embers ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => {
          const size = (i % 3) + 2;
          const left = (i * 5.7 + 3) % 100;
          const top = (i * 11.3 + 5) % 90;
          const dur = 7 + (i % 8) * 1.5;
          const del = (i % 6) * 1.2;
          return (
            <span key={i} className="absolute rounded-full" style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              backgroundColor: i % 3 === 0 ? "#fe5723" : i % 3 === 1 ? "#ff8b42" : "#ffffff",
              boxShadow: i % 3 === 0 ? "0 0 8px #fe5723, 0 0 18px rgba(254,87,35,0.5)" : "0 0 6px rgba(255,255,255,0.6)",
              opacity: 0,
              animation: `ember-float ${dur}s ease-in-out ${del}s infinite`,
            }} />
          );
        })}
      </div>

      {/* ── MAIN CONTENT (clears the floating navbar with pt-28 sm:pt-32 md:pt-36) ── */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 flex-grow justify-center">

        {/* ── TOP TACTICAL BADGE ── */}
        <div
          className="mb-2 sm:mb-3 transition-all duration-700"
          style={{
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? "translateY(0)" : "translateY(-14px)",
          }}
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(254,87,35,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500 shadow-[0_0_8px_#fe5723]" />
            </span>
            <DecryptedText
              text="SEATTLE'S PREMIER STREET SOCCER & TOURNAMENTS"
              speed={28}
              maxIterations={12}
              delay={300}
              className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase"
            />
          </div>
        </div>

        {/* ── AUTHENTIC GUNNER EMBLEM ── */}
        <GunnerHeroEmblem mounted={heroMounted} />

        {/* Sub-headline tagline */}
        <p
          className="text-white/50 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-3 sm:mb-4 transition-all duration-700"
          style={{
            transitionDelay: "580ms",
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <ShinyText text="THE GAME PLAN IS TO HAVE FUN & WIN" speed={5} className="text-white/50" />
        </p>

        {/* Body copy */}
        <p
          className="text-white/60 text-sm sm:text-base max-w-lg mx-auto font-light leading-relaxed mb-6 sm:mb-8 transition-all duration-700"
          style={{
            transitionDelay: "650ms",
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? "translateY(0)" : "translateY(10px)",
          }}
        >
          Experience the thrill of competitive street soccer tournaments, youth development, and community impact across Greater Seattle.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10 transition-all duration-700"
          style={{
            transitionDelay: "750ms",
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <ScrambleButton
            to="/events"
            className="group relative px-7 py-3 sm:px-8 sm:py-3.5 font-black text-white text-xs sm:text-sm rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
              boxShadow: "0 0 28px rgba(254,87,35,0.45), 0 4px 20px rgba(254,87,35,0.3)",
            }}
          >
            Join the Action →
          </ScrambleButton>

          <Link
            to="/about-us"
            className="px-7 py-3 sm:px-8 sm:py-3.5 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white text-xs sm:text-sm font-semibold rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 tracking-widest uppercase"
          >
            Learn More
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="flex flex-row gap-3 sm:gap-5 justify-center transition-all duration-700"
          style={{
            transitionDelay: "900ms",
            opacity: heroMounted ? 1 : 0,
          }}
        >
          <StatPill value="500+" label="Youth Players" delay={950} />
          <StatPill value="7"    label="Partnerships"  delay={1050} />
          <StatPill value="12+"  label="Tournaments"   delay={1150} />
        </div>
      </div>

      {/* ── BOTTOM PANEL (stands naturally at the bottom, no overlapping) ── */}
      <div className="relative z-30 w-full mt-auto">
        {/* Ticker strip */}
        <div className="border-t border-white/[0.08] py-2.5 overflow-hidden bg-white/[0.03] backdrop-blur-sm">
          <TickerTrack items={tickerItems} />
        </div>

        {/* Featured event / promo bar */}
        <div className="border-t border-white/10 bg-black/70 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4">
          {loading ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
              <div className="flex gap-3 items-center">
                <div className="h-3 bg-white/10 rounded-full w-20 animate-pulse" />
                <div className="h-5 bg-white/10 rounded-full w-44 animate-pulse" />
              </div>
              <div className="h-4 bg-white/10 rounded-full w-80 animate-pulse" />
              <div className="h-8 bg-secondary-500/20 rounded-full w-28 animate-pulse" />
            </div>
          ) : featuredEvent ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-center md:text-left">
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-secondary-500/20 border border-secondary-500/40 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
                </span>
                <div>
                  <p className="text-secondary-400 text-[10px] font-black tracking-[0.25em] uppercase">Coming Soon</p>
                  <p className="text-white text-sm sm:text-base font-bold leading-tight">{featuredEvent.title}</p>
                  {featuredEvent.date && (
                    <p className="text-white/40 text-xs mt-0.5">{formatDate(featuredEvent.date)}</p>
                  )}
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/10" />
              <p className="text-white/40 text-xs sm:text-sm max-w-sm">{featuredEvent.description}</p>
              <a
                href={`/events/${featuredEvent.type || "tournament"}/${featuredEvent.id}`}
                className="group inline-flex items-center gap-2 px-5 py-2 rounded-full border border-secondary-500/50 bg-secondary-500/10 text-secondary-400 hover:bg-secondary-500 hover:text-white hover:border-secondary-500 font-bold text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 flex-shrink-0"
              >
                Register Now
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-center md:text-left">
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/15 flex-shrink-0">
                  <span className="text-white/60 text-xs">★</span>
                </span>
                <div>
                  <p className="text-secondary-400 text-[10px] font-black tracking-[0.25em] uppercase">Impact Highlights</p>
                  <p className="text-white text-sm sm:text-base font-bold">Summer &apos;26 Community Recap</p>
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/10" />
              <p className="text-white/40 text-xs sm:text-sm max-w-sm">
                7 community partnerships completed, over 500 youth players engaged, and championship moments celebrated across Seattle.
              </p>
              <Link
                to="/community-impact"
                className="group inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40 font-bold text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 flex-shrink-0"
              >
                Explore Stories
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes pulse-bloom {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ember-float {
          0%   { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          20%  { opacity: 0.5; }
          50%  { transform: translateY(-40px) translateX(12px) scale(1.1); opacity: 0.7; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-80px) translateX(-8px) scale(0.6); opacity: 0; }
        }
      `}</style>
      </div>
    </SwarmCursor>
  );
};

export default HeroSection;
