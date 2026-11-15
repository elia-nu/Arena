import { useState, useEffect, useMemo } from "react";
import Marquee from "react-fast-marquee";
import { testimonialAPI } from "../services/api";

const DEFAULT_TESTIMONIALS = [
  {
    _id: "def-1",
    name: "Dawit T.",
    role: "Team Captain · Addis Ababa",
    quote:
      "The street soccer tournament brought the entire community together. Smooth registration, professional refs, and unreal energy on the pitch from start to finish.",
    rating: 5,
  },
  {
    _id: "def-2",
    name: "Bethlehem A.",
    role: "Parent · Hawassa",
    quote:
      "Seeing youth players get a real tournament stage with live commentary, music, and community pride was unforgettable. Our kids are already counting down to next season.",
    rating: 5,
  },
  {
    _id: "def-3",
    name: "Yohannes G.",
    role: "Player · Addis Ababa (Bole)",
    quote:
      "From bracket updates to match schedules, everything ran like clockwork. Hands down the premier competitive street soccer event in Ethiopia.",
    rating: 5,
  },
  {
    _id: "def-4",
    name: "Selamawit K.",
    role: "Community Partner · Hawassa",
    quote:
      "The community impact is genuine. Competing while empowering local youth sports programs creates an environment and purpose you won't find anywhere else.",
    rating: 5,
  },
  {
    _id: "def-5",
    name: "Henok B.",
    role: "Team Leader · Addis Ababa (Piassa)",
    quote:
      "Our squad has competed in three cups now. The competition is fierce, sportsmanship is celebrated, and the overall organization is top tier.",
    rating: 5,
  },
  {
    _id: "def-6",
    name: "Natnael M.",
    role: "Forward · Hawassa",
    quote:
      "Fast-paced games, energetic crowds, and high-level officiating. The Arena has set a new standard for what a community soccer tournament should feel like.",
    rating: 5,
  },
  {
    _id: "def-7",
    name: "Rahel D.",
    role: "Youth Coach · Addis Ababa",
    quote:
      "A safe, electric, and inspiring space for players of all backgrounds. It fosters authentic grit, sportsmanship, and true love for the game.",
    rating: 5,
  },
  {
    _id: "def-8",
    name: "Ermias Z.",
    role: "Team Captain · Hawassa",
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
  const { name, role, quote, rating = 5 } = testimonial;
  const initials = getInitials(name);

  return (
    <div className="w-[320px] sm:w-[360px] shrink-0 mx-2.5 my-2 bg-white rounded-xl p-5 border border-neutral-200 hover:border-secondary-500/50 hover:shadow-md transition-all duration-150 flex flex-col justify-between select-none">
      <div>
        {/* Rating Stars in Brand Orange */}
        <div className="flex items-center gap-1 mb-3" aria-label={`${rating} out of 5 stars`}>
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-3.5 h-3.5 ${
                i < rating ? "text-secondary-500" : "text-neutral-200"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Quote */}
        <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed mb-4">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* Author Footer */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-neutral-100">
        <div className="w-7 h-7 rounded-full bg-secondary-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-neutral-900 truncate">{name}</h4>
          <p className="text-[11px] text-neutral-500 truncate">{role}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = ({
  badge = "Community Feedback",
  title = "What Community",
  subtitle = "Stories from team captains, players, and families across Addis Ababa and Hawassa.",
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

  const itemsList = useMemo(() => {
    if (dbTestimonials.length >= 8) {
      return dbTestimonials;
    }
    if (dbTestimonials.length > 0) {
      return [...dbTestimonials, ...DEFAULT_TESTIMONIALS];
    }
    return DEFAULT_TESTIMONIALS;
  }, [dbTestimonials]);

  const { row1, row2 } = useMemo(() => {
    const r1 = itemsList.filter((_, idx) => idx % 2 === 0);
    const r2 = itemsList.filter((_, idx) => idx % 2 !== 0);

    return {
      row1: r1.length > 0 ? r1 : itemsList,
      row2: r2.length > 0 ? r2 : [...itemsList].reverse(),
    };
  }, [itemsList]);

  return (
    <section className="py-20 sm:py-24 bg-neutral-50/70 overflow-hidden border-t border-neutral-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 px-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/30 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <span className="text-xs font-semibold text-secondary-600">
              {badge}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-950 tracking-tight mb-3 uppercase">
            {title} <span className="text-secondary-500">Says</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Level Marquee Track */}
        <div className="relative w-full overflow-hidden py-2">
          {/* Edge gradient masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-neutral-50 via-neutral-50/80 to-transparent z-10" />

          {/* Row 1 */}
          <div className="mb-2">
            <Marquee
              direction="left"
              speed={28}
              pauseOnHover={true}
              autoFill={true}
              className="py-1 overflow-visible"
            >
              {row1.map((item, idx) => (
                <TestimonialCard
                  key={item._id ? `r1-${item._id}` : `r1-${idx}`}
                  testimonial={item}
                />
              ))}
            </Marquee>
          </div>

          {/* Row 2 */}
          <div>
            <Marquee
              direction="right"
              speed={24}
              pauseOnHover={true}
              autoFill={true}
              className="py-1 overflow-visible"
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
    </section>
  );
};

export default Testimonials;
