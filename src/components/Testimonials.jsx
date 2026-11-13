import { useState, useEffect, useMemo } from "react";
import Marquee from "react-fast-marquee";
import { testimonialAPI } from "../services/api";

const DEFAULT_TESTIMONIALS = [
  {
    _id: "def-1",
    name: "Marcus K.",
    role: "Team Captain · Seattle",
    quote:
      "The street soccer tournament brought the entire community together. Smooth registration, professional refs, and unreal energy on the pitch from start to finish.",
    rating: 5,
  },
  {
    _id: "def-2",
    name: "Sarah L.",
    role: "Parent · Shoreline",
    quote:
      "Seeing youth players get a real tournament stage with live commentary, music, and community pride was unforgettable. Our kids are already counting down to next season.",
    rating: 5,
  },
  {
    _id: "def-3",
    name: "David M.",
    role: "Player · Tacoma",
    quote:
      "From bracket updates to match schedules, everything ran like clockwork. Hands down the premier competitive street soccer event in the Pacific Northwest.",
    rating: 5,
  },
  {
    _id: "def-4",
    name: "Elena R.",
    role: "Community Partner · Bellevue",
    quote:
      "The community impact is genuine. Competing while empowering local youth sports programs creates an environment and purpose you won't find anywhere else.",
    rating: 5,
  },
  {
    _id: "def-5",
    name: "Jamal W.",
    role: "Team Leader · Renton",
    quote:
      "Our squad has competed in three cups now. The competition is fierce, sportsmanship is celebrated, and the overall organization is top tier.",
    rating: 5,
  },
  {
    _id: "def-6",
    name: "Christian T.",
    role: "Forward · Everett",
    quote:
      "Fast-paced games, energetic crowds, and high-level officiating. The Arena has set a new standard for what a community soccer tournament should feel like.",
    rating: 5,
  },
  {
    _id: "def-7",
    name: "Maya S.",
    role: "Youth Coach · Seattle",
    quote:
      "A safe, electric, and inspiring space for players of all backgrounds. It fosters authentic grit, sportsmanship, and true love for the game.",
    rating: 5,
  },
  {
    _id: "def-8",
    name: "Andre P.",
    role: "Team Captain · Kent",
    quote:
      "The live match updates kept all our supporters hyped throughout the day. Lifting the championship trophy with the squad was the highlight of our summer.",
    rating: 5,
  },
];

const getInitials = (name) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const TestimonialCard = ({ testimonial }) => {
  const { name, role, quote, rating = 5, avatar } = testimonial;
  const initials = getInitials(name);

  return (
    <div className="group relative w-[320px] sm:w-[350px] md:w-[380px] shrink-0 mx-3 sm:mx-4 my-3 bg-white rounded-2xl p-6 md:p-7 border border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-secondary-500/15 hover:border-secondary-500 hover:scale-[1.04] hover:-translate-y-2 hover:rotate-2 hover:skew-x-3 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer select-none">
      {/* Subtle Orange Accent Glow */}
      <div className="absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary-500/0 to-transparent group-hover:via-secondary-500/70 transition-all duration-500 rounded-t-2xl" />

      <div>
        {/* Rating & Decorative Quote */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center gap-1"
            aria-label={`${rating} out of 5 stars`}
          >
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 transition-colors ${
                  i < rating
                    ? "text-secondary-500 fill-secondary-500"
                    : "text-neutral-200 fill-neutral-200"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <span className="text-2xl font-serif text-neutral-300 group-hover:text-secondary-400/50 transition-colors duration-300 leading-none select-none">
            &ldquo;
          </span>
        </div>

        {/* Quote in High-Contrast Charcoal/Black */}
        <p className="text-neutral-800 text-sm leading-relaxed line-clamp-4 min-h-[4.5rem]">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* Divider & Author in Black & White with Orange Accents */}
      <div className="border-t border-neutral-100 pt-4 mt-5 flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-neutral-200 group-hover:ring-secondary-500 transition-colors"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-10 h-10 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0 tracking-wider group-hover:bg-secondary-500 transition-colors duration-300 shadow-sm ${
            avatar ? "hidden" : ""
          }`}
          aria-hidden
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-black truncate group-hover:text-secondary-600 transition-colors">
            {name}
          </h4>
          <p className="text-xs text-neutral-500 truncate font-medium">
            {role}
          </p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = ({
  badge = "TESTIMONIALS",
  title = "What Clients Say",
  subtitle = "Real stories from players, teams, and families who experienced the thrill and community of The Arena.",
}) => {
  const [dbTestimonials, setDbTestimonials] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialAPI.getAll({ status: "published" });
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const valid = data.filter(
            (item) => item.quote && item.quote.trim().length > 10 && item.name
          );
          if (valid.length > 0) {
            setDbTestimonials(valid);
          }
        }
      } catch (err) {
        console.warn("Could not fetch testimonials, using defaults:", err);
      }
    };

    fetchTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge database testimonials with defaults to ensure full marquee density
  const itemsList = useMemo(() => {
    if (dbTestimonials.length >= 8) {
      return dbTestimonials;
    }
    if (dbTestimonials.length > 0) {
      return [...dbTestimonials, ...DEFAULT_TESTIMONIALS];
    }
    return DEFAULT_TESTIMONIALS;
  }, [dbTestimonials]);

  // Split into two distinct rows for the dual-row marquee
  const { row1, row2 } = useMemo(() => {
    const r1 = itemsList.filter((_, idx) => idx % 2 === 0);
    const r2 = itemsList.filter((_, idx) => idx % 2 !== 0);

    return {
      row1: r1.length > 0 ? r1 : itemsList,
      row2: r2.length > 0 ? r2 : [...itemsList].reverse(),
    };
  }, [itemsList]);

  return (
    <section className="py-20 md:py-28 bg-[#fafafa] overflow-hidden relative border-t border-neutral-200/60">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-secondary-500/[0.04] rounded-full blur-[140px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header in Orange, Black & White */}
        <div className="text-center mb-12 md:mb-16 px-4 max-w-3xl mx-auto">
          {/* Orange Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/25 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-secondary-500">
              {badge}
            </span>
          </div>

          {/* Black & Orange Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight mb-4">
            What Clients <span className="text-secondary-500">Say</span>
          </h2>

          {/* Subtitle in Clean Charcoal */}
          <p className="text-sm md:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Skewed Carousel Track Container (inspired by reactbits.dev) */}
        <div className="relative w-full overflow-hidden py-8 sm:py-12">
          {/* Left and Right Smooth Gradient Fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 md:w-56 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/90 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 md:w-56 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/90 to-transparent z-20" />

          {/* Skewed Marquee Track with -rotate-2 -skew-x-3 and scale */}
          <div className="transform -rotate-2 sm:-rotate-3 -skew-x-2 sm:-skew-x-3 scale-[1.03] sm:scale-105 transition-transform duration-500 origin-center py-4">
            {/* Row 1: Scrolling Left */}
            <div className="mb-4 sm:mb-6">
              <Marquee
                direction="left"
                speed={35}
                pauseOnHover={true}
                autoFill={true}
                className="py-3 overflow-visible"
              >
                {row1.map((item, idx) => (
                  <TestimonialCard
                    key={item._id ? `r1-${item._id}` : `r1-${idx}`}
                    testimonial={item}
                  />
                ))}
              </Marquee>
            </div>

            {/* Row 2: Scrolling Right */}
            <div>
              <Marquee
                direction="right"
                speed={30}
                pauseOnHover={true}
                autoFill={true}
                className="py-3 overflow-visible"
              >
                {row2.map((item, idx) => (
                  <TestimonialCard
                    key={item._id ? `r2-${item._id}` : `r2-${idx}`}
                    testimonial={item}
                  />
                ))}
              </Marquee>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
