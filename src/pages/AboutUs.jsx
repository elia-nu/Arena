import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  IoPeopleOutline,
  IoRocketOutline,
  IoShieldCheckmarkOutline,
  IoFootballOutline,
  IoTrophyOutline,
  IoLocationOutline,
  IoSparklesOutline,
  IoArrowForward,
  IoFlameOutline,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoPlayCircleOutline,
  IoOpenOutline,
  IoNewspaperOutline,
  IoGlobeOutline,
} from "react-icons/io5";
import DriftWall from "../components/reactbits/DriftWall";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import { usePageSEO } from "../hooks/usePageSEO";

const stats = [
  { value: "1,000+", label: "Urban Mini-Stadiums", sublabel: "Addis Ababa municipal sports initiative" },
  { value: "12,000+", label: "Players & Community", sublabel: "Active across tournaments & clinics" },
  { value: "48+", label: "Grassroots Squads", sublabel: "Representing diverse neighborhoods" },
  { value: "2", label: "Flagship Hubs", sublabel: "Addis Ababa & Hawassa, Ethiopia" },
];

const pillars = [
  {
    title: "Street Soccer Tournaments",
    badge: "Competition",
    description:
      "High-tempo 5v5 and 7v7 matches hosted on urban pitches and turf cages. We provide certified referees, digital live brackets, and championship trophies.",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80",
    icon: IoFootballOutline,
    link: "/events",
    linkText: "Browse Tournaments",
  },
  {
    title: "Youth Clinics & Empowerment",
    badge: "Grassroots",
    description:
      "Free coaching sessions, technical drills, and life skills workshops designed to nurture young talent and keep Ethiopian youth active, safe, and inspired.",
    image:
      "https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=800&h=600&fit=crop&q=80",
    icon: IoPeopleOutline,
    link: "/community-impact",
    linkText: "See Youth Impact",
  },
  {
    title: "Culture, Music & Camaraderie",
    badge: "Movement",
    description:
      "More than just matches—The Arena turns game days into vibrant neighborhood festivals blending street soundscapes, food, fans, and mutual respect.",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=600&fit=crop&q=80",
    icon: IoSparklesOutline,
    link: "/gallery",
    linkText: "Explore Gallery",
  },
];

const values = [
  {
    number: "01",
    icon: IoPeopleOutline,
    title: "Community First",
    description:
      "We build an inclusive home for soccer lovers of every background, keeping our courts accessible and our community united.",
  },
  {
    number: "02",
    icon: IoFlameOutline,
    title: "Street Authenticity",
    description:
      "We honor the raw, creative rhythm of Ethiopian street soccer—the flair, the passion, and the neighborhood loyalty.",
  },
  {
    number: "03",
    icon: IoShieldCheckmarkOutline,
    title: "Fair Play & Respect",
    description:
      "On and off the pitch, integrity is non-negotiable. We celebrate sportsmanship, referee respect, and camaraderie above all.",
  },
  {
    number: "04",
    icon: IoRocketOutline,
    title: "Opportunity & Innovation",
    description:
      "By combining modern digital tournament tools with grassroots clinics, we elevate local players and open doors for future stars.",
  },
];

const galleryMoments = [
  {
    id: 1,
    title: "Night Lights at Addis Cage",
    category: "Matchday",
    location: "Addis Ababa",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&h=750&fit=crop&q=80",
    description: "Intense 5v5 action under the floodlights with hundreds of neighborhood fans cheering on.",
  },
  {
    id: 2,
    title: "Youth Grassroots Clinic",
    category: "Clinics",
    location: "Hawassa Lakeside",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1000&h=750&fit=crop&q=80",
    description: "Young athletes mastering ball control, agility drills, and team bonding.",
  },
  {
    id: 3,
    title: "Trophy Celebration & Team Spirit",
    category: "Championship",
    location: "Addis Ababa",
    image:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1000&h=750&fit=crop&q=80",
    description: "Unfiltered joy and sportsmanship as the Champions lift the inaugural cup.",
  },
  {
    id: 4,
    title: "Fast-Paced Futsal Control",
    category: "Matchday",
    location: "Bole Arena",
    image:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1000&h=750&fit=crop&q=80",
    description: "Quick turns and rapid passing in tight quarters on artificial turf.",
  },
  {
    id: 5,
    title: "Golden Hour Matchday Kickoff",
    category: "Matchday",
    location: "Hawassa",
    image:
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1000&h=750&fit=crop&q=80",
    description: "Boots laced and ready as the sun sets over the southern tournament circuit.",
  },
  {
    id: 6,
    title: "Next Gen Talent Showcase",
    category: "Clinics",
    location: "Addis Ababa",
    image:
      "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=1000&h=750&fit=crop&q=80",
    description: "Mentoring the next generation of Ethiopian street ballers and community leaders.",
  },
  {
    id: 7,
    title: "1,000+ Mini-Stadiums Project (EBC)",
    category: "Matchday",
    location: "Addis Ababa",
    image:
      "https://ebc.et/admin/news/2025/10/29/34ed59e2-0b51-403b-814b-d94b7695b4e0.jpg",
    description: "PM Abiy Ahmed announces 1,000+ new urban mini-stadiums to elevate community and youth soccer.",
  },
];

const timelineMilestones = [
  {
    year: "2024",
    title: "The Grassroots Spark",
    description:
      "Started as informal pickup matches on neighborhood gravel courts in Addis Ababa. The overwhelming turnout inspired the creation of The Arena.",
  },
  {
    year: "2025",
    title: "Expanding to Hawassa",
    description:
      "Launched our second major hub in Hawassa, hosting cross-city invitationals and free weekend clinics for over 400 local youths.",
  },
  {
    year: "2026",
    title: "The Digital Arena Platform",
    description:
      "Rolled out live digital brackets, automated team registration, and player profile tracking to bring professional standards to grassroots sports.",
  },
  {
    year: "Beyond",
    title: "Pan-Ethiopian Youth Circuit",
    description:
      "Building permanent community futsal cages, expanding tournament circuits to more cities, and empowering thousands of young dreamers.",
  },
];

const communityMoments = [
  {
    image: "https://ebc.et/admin/news/2025/10/29/34ed59e2-0b51-403b-814b-d94b7695b4e0.jpg",
    title: "1,000+ Addis Mini-Stadiums (EBC)",
    href: "https://www.ebc.et/english/Home/NewsDetails?NewsId=2705",
  },
  {
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
    title: "Street Soccer Matches",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
    title: "Youth Clinics",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&h=400&fit=crop",
    title: "Championship Finals",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&h=400&fit=crop",
    title: "Under The Lights",
    href: "/gallery",
  },
  {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    title: "Training & Conditioning",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=600&h=400&fit=crop",
    title: "Team Camaraderie",
    href: "/community-impact",
  },
  {
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&h=400&fit=crop",
    title: "Matchday Energy",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop",
    title: "Urban Turf Battles",
    href: "/gallery",
  },
  {
    image: "https://images.unsplash.com/photo-1517840933442-d2d1a05edb84?w=600&h=400&fit=crop",
    title: "Community Outreach",
    href: "/community-impact",
  },
  {
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop",
    title: "Skill Showcases",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=400&fit=crop",
    title: "Golden Hour Kickoff",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&h=400&fit=crop",
    title: "Fair Play & Respect",
    href: "/about-us",
  },
  {
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop",
    title: "Addis & Hawassa Summer Cup",
    href: "/events",
  },
  {
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=400&fit=crop",
    title: "Grassroots Spirit",
    href: "/community-impact",
  },
  {
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=400&fit=crop",
    title: "Celebration & Glory",
    href: "/gallery",
  },
];

const partners = [
  "Rave's Foundation",
  "King County Youth Partners",
  "Addis Ababa Youth Sports Council",
  "Hawassa Sports Federation",
  "Grassroots Street Soccer Alliance",
];

const AboutUs = () => {
  usePageSEO({
    title: "About Us",
    description:
      "Learn about The Arena's mission, team, and urban street soccer movement across Addis Ababa and Hawassa, Ethiopia.",
    path: "/about-us",
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activePhoto, setActivePhoto] = useState(null);

  const categories = ["All", "Matchday", "Clinics", "Championship"];

  const filteredGallery =
    selectedCategory === "All"
      ? galleryMoments
      : galleryMoments.filter((item) => item.category === selectedCategory);

  const ebcHeroWebp =
    "https://ebc.et/admin/uploads/2025/10/29/403e17fa-b697-42b5-b1ff-911b9833369b.webp";
  const ebcHeroFallback = "/ebc-stadium-hero.webp";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-secondary-500 selection:text-white">
      {/* ─── HERO SECTION ON TOP (MATCHING EXACT COMMUNITY STADIUM BANNER) ─── */}
      <section className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[740px] flex items-center pt-32 sm:pt-40 pb-20 md:pb-28 overflow-hidden bg-neutral-950">
        {/* Full-bleed Background Image */}
        <div className="absolute inset-0">
          <img
            src={ebcHeroWebp}
            onError={(e) => {
              e.currentTarget.src = ebcHeroFallback;
            }}
            alt="About The Arena - Ethiopian Street Soccer Community"
            className="w-full h-full object-cover object-center scale-102"
          />
          {/* Cinematic Vignette Overlay - dark on left for text contrast, translucent on right for players */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full relative z-10">
          <div className="max-w-2xl text-left">
            {/* Top movement pill */}
            <motion.div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 text-xs font-semibold tracking-wide uppercase mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
              <span>Ethiopian Street Soccer • Addis Ababa &amp; Hawassa</span>
            </motion.div>

            {/* Massive Bold Heading */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.98] mb-6 uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              ABOUT <span className="text-secondary-500">US</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-white/90 font-light max-w-xl leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Rooted in Ethiopian street soccer culture across Addis Ababa and Hawassa, uniting players, youth, and families through authentic competition.
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <a
                href="#our-story"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg hover:shadow-secondary-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                OUR STORY <IoArrowForward className="text-sm" />
              </a>
              <Link
                to="/events"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-widest rounded-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                EXPLORE EVENTS
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom Right Tagline Watermark (Official Arena Gunner Motto) */}
        <motion.div
          className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 text-right select-none pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[0.25em] text-secondary-500 font-bold uppercase mb-0.5">
            THE ARENA
          </div>
          <div className="text-base sm:text-lg font-black text-white tracking-wider uppercase">
            LET'S RUMBLE.
          </div>
        </motion.div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="border-y border-primary-200/80 bg-primary-50/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center md:text-left border-l-2 border-secondary-500/30 pl-4 md:pl-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-950 tracking-tight">
                  <span className="text-secondary-500">{stat.value.charAt(0)}</span>
                  {stat.value.slice(1)}
                </div>
                <div className="text-sm font-bold text-primary-900 mt-1">{stat.label}</div>
                <div className="text-xs text-primary-600 mt-0.5 hidden sm:block">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUR STORY & ROOTS SECTION (MULTI-IMAGE COLLAGE) ─── */}
      <section id="our-story" className="py-20 md:py-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-14 lg:gap-16 items-center">
            {/* Story Text */}
            <motion.div
              className="lg:col-span-6 order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 text-secondary-600 font-semibold text-xs tracking-widest uppercase mb-3">
                <span className="w-6 h-0.5 bg-secondary-500" />
                Our Roots &amp; Mission
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-950 tracking-tight leading-tight mb-6">
                From Gravel Neighborhood Courts to{" "}
                <span className="text-secondary-500">Championship Nights</span>
              </h2>

              <div className="space-y-4 text-primary-700 leading-relaxed font-normal text-base md:text-lg">
                <p>
                  In the bustling neighborhoods of Addis Ababa, soccer isn't merely an extracurricular
                  sport—it is an everyday pulse. Kids play till dusk between average stones as goalposts,
                  showcasing breathtaking agility, flicking passes through tight alleys, and forging
                  unbreakable bonds.
                </p>
                <p>
                  Yet for years, street players had no organized tournament stage to showcase their skills,
                  no verified referees, and no structured pathways to turn their raw talent into community
                  celebration. That is why <strong>The Arena</strong> was created.
                </p>
                <p>
                  Today, active across both <strong>Addis Ababa and Hawassa</strong>, The Arena provides
                  turn-key tournament infrastructure, youth clinics, and social empowerment programs.
                  Through partnerships with regional sports federations, city recreation centers,
                  Rave&apos;s Foundation, King County, and neighborhood captains, we ensure that every
                  passionate player has a pitch where they belong.
                </p>
              </div>

              {/* Story Highlights Bullet List */}
              <div className="mt-8 grid sm:grid-cols-2 gap-4 pt-6 border-t border-primary-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-primary-950 text-sm">Addis &amp; Hawassa Hubs</h5>
                    <p className="text-xs text-primary-600">Cross-regional tournaments and player exchange</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-bold text-primary-950 text-sm">Youth Mentorship</h5>
                    <p className="text-xs text-primary-600">Free weekend coaching clinics &amp; gear support</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Story Image Collage */}
            <motion.div
              className="lg:col-span-6 order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-2 gap-4 relative">
                {/* Image 1: Main action street soccer */}
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-primary-200 group">
                    <img
                      src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&h=750&fit=crop&q=80"
                      alt="Street futsal duel"
                      className="w-full h-64 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="bg-secondary-50 p-4 sm:p-5 rounded-2xl border border-secondary-200 text-secondary-900">
                    <p className="text-xs uppercase font-bold tracking-wider text-secondary-600">
                      Our Motto
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      "Respect The Streets. Conquer The Arena."
                    </p>
                  </div>
                </div>

                {/* Image 2: Celebration & Community */}
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-primary-200 group">
                    <img
                      src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=500&fit=crop&q=80"
                      alt="Team huddle celebration"
                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-primary-200 group">
                    <img
                      src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=600&fit=crop&q=80"
                      alt="Soccer boots on pitch"
                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Central Floating Metric Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-primary-200 text-center pointer-events-none hidden sm:block">
                  <div className="text-2xl font-black text-secondary-500">100%</div>
                  <div className="text-[11px] font-bold text-primary-800 uppercase tracking-wider">
                    Grassroots Driven
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED HEROIC BANNER SECTION WITH IMAGE ─── */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative rounded-[2.5rem] overflow-hidden bg-primary-950 border border-primary-800 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background Image with Dark Vignette & Dynamic Glows */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1600&h=800&fit=crop&q=80"
                alt="Panoramic soccer turf under floodlights"
                className="w-full h-full object-cover object-center scale-105 opacity-25 filter blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/92 to-primary-950/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-transparent to-transparent" />
              {/* Radial color accent glows */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-tertiary-500/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Banner Content Layout */}
            <div className="relative z-10 p-8 sm:p-12 lg:p-16">
              <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Side: Headline, Details, Badges, Buttons */}
                <div className="lg:col-span-7 text-left text-white space-y-6">
                  {/* Top Live Badge */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary-500/20 border border-secondary-500/40 text-secondary-400 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                    2026 Tournament Tour • Addis Ababa &amp; Hawassa
                  </div>

                  {/* Headline */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
                    From Neighborhood Dirt Courts To The{" "}
                    <span className="bg-gradient-to-r from-secondary-400 via-secondary-500 to-tertiary-400 bg-clip-text text-transparent">
                      Roar of Stadium Lights
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="text-primary-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
                    Every weekend across Addis Ababa and Hawassa, hundreds of street footballers step
                    onto our turf cages to play for pride, trophies, and community honor. Witness the raw
                    speed, passion, and electric atmosphere of Ethiopian street soccer.
                  </p>

                  {/* Feature Badges Grid */}
                  <div className="grid sm:grid-cols-3 gap-3.5 pt-2">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center text-lg flex-shrink-0">
                        <IoFlashOutline />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white leading-tight">Fast 5v5 &amp; 7v7</h5>
                        <p className="text-[11px] text-primary-400 mt-0.5">High-tempo cage format</p>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center text-lg flex-shrink-0">
                        <IoTrophyOutline />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white leading-tight">Championship Cup</h5>
                        <p className="text-[11px] text-primary-400 mt-0.5">Trophies &amp; Cash Prizes</p>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center text-lg flex-shrink-0">
                        <IoLocationOutline />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white leading-tight">2 Cities, 1 Pitch</h5>
                        <p className="text-[11px] text-primary-400 mt-0.5">Addis &amp; Hawassa Hubs</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-full shadow-xl shadow-secondary-500/30 hover:scale-102 transition-all duration-300 text-sm tracking-wide"
                    >
                      <IoFootballOutline className="text-lg" />
                      Register For Next Event
                      <IoArrowForward className="text-sm" />
                    </Link>
                    <Link
                      to="/gallery"
                      className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-full border border-white/20 transition-all duration-300 text-sm tracking-wide backdrop-blur-sm"
                    >
                      <IoPlayCircleOutline className="text-lg text-secondary-400" />
                      Watch Match Highlights
                    </Link>
                  </div>
                </div>

                {/* Right Side: Foreground Layered Image Showcase */}
                <div className="lg:col-span-5 relative">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    {/* Primary Showcase Card Image */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-secondary-500/30 bg-primary-900 group">
                      <img
                        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80"
                        alt="Matchday under floodlights"
                        className="w-full h-72 sm:h-84 object-cover transition-transform duration-700 group-hover:scale-106"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Top Pill on Image */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 bg-secondary-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-md">
                          Live Fixture
                        </span>
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold rounded-full border border-white/20">
                          Addis Cage Finals
                        </span>
                      </div>

                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center justify-between text-xs text-primary-300 mb-1">
                          <span className="flex items-center gap-1">
                            <IoLocationOutline className="text-secondary-400" /> Addis Ababa Stadium Cage
                          </span>
                          <span className="font-mono text-secondary-400 font-bold">MATCHDAY #14</span>
                        </div>
                        <h4 className="text-lg font-bold">Bole Tigers vs Hawassa Hawks</h4>
                      </div>
                    </div>

                    {/* Floating Mini Image Tag in Corner */}
                    <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-primary-200 flex items-center gap-3 max-w-[210px] sm:max-w-[240px]">
                      <img
                        src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=160&h=160&fit=crop&q=80"
                        alt="Trophy celebration"
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-secondary-600 flex items-center gap-1">
                          <IoTrophyOutline /> Trophy Cup
                        </div>
                        <p className="text-xs font-bold text-primary-950 leading-tight">
                          Champions Glory &amp; Medals
                        </p>
                      </div>
                    </div>

                    {/* Floating Stats Tag in Corner */}
                    <div className="absolute -top-4 -right-3 sm:-right-5 bg-secondary-500 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      48+ Teams Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT WE DO / THREE PILLARS (IMAGE CARDS) ─── */}
      <section className="py-20 bg-primary-100/60 border-y border-primary-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 bg-secondary-100 text-secondary-600 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
              What Powers The Arena
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-950 tracking-tight">
              Three Pillars of Our <span className="text-secondary-500">Impact</span>
            </h2>
            <p className="text-primary-600 text-base md:text-lg mt-4 font-normal">
              We integrate competition, youth development, and cultural celebrations to create an
              unmatched sporting platform across Ethiopia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  className="bg-white rounded-3xl overflow-hidden border border-primary-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  {/* Card Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md text-primary-900 font-bold text-xs rounded-full shadow-sm">
                      {pillar.badge}
                    </span>
                    <div className="absolute bottom-4 left-4 w-10 h-10 rounded-xl bg-secondary-500 text-white flex items-center justify-center text-xl shadow-md">
                      <Icon />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-primary-950 mb-3 group-hover:text-secondary-600 transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-primary-600 text-sm leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-primary-100">
                      <Link
                        to={pillar.link}
                        className="inline-flex items-center gap-2 text-sm font-bold text-secondary-600 hover:text-secondary-700 transition-colors group-hover:translate-x-1 duration-200"
                      >
                        {pillar.linkText}
                        <IoArrowForward className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── INSIDE THE ARENA (PHOTO SHOWCASE & MODAL) ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-secondary-600 font-bold text-xs tracking-widest uppercase block mb-2">
                Moments From The Pitch
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-950 tracking-tight">
                Life Inside <span className="text-secondary-500">The Arena</span>
              </h2>
              <p className="text-primary-600 text-base max-w-xl mt-3">
                Experience the raw emotion, dazzling footwork, and united community captured live across
                our tournament fixtures in Addis Ababa and Hawassa.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-primary-100 p-1.5 rounded-full self-start md:self-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-secondary-500 text-white shadow-sm"
                      : "text-primary-700 hover:text-primary-950 hover:bg-white/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGallery.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActivePhoto(item)}
                  className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 border border-primary-200 aspect-[4/3] bg-primary-900"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

                  {/* Top Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                      {item.category}
                    </span>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-secondary-400 font-semibold mb-1">
                      <IoLocationOutline />
                      {item.location}
                    </div>
                    <h4 className="text-lg font-bold leading-tight group-hover:text-secondary-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-primary-200 line-clamp-1 mt-1 font-light opacity-90">
                      {item.description}
                    </p>
                  </div>

                  {/* Hover Quick Action */}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-secondary-500/90 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                    <IoSparklesOutline />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox / Image Modal */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full bg-primary-950 rounded-3xl overflow-hidden border border-primary-800 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
                <img
                  src={activePhoto.image}
                  alt={activePhoto.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-2xl transition-colors border border-white/20"
                >
                  <IoCloseOutline />
                </button>
              </div>

              <div className="p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-500 text-white text-xs font-bold uppercase">
                      {activePhoto.category}
                    </span>
                    <span className="text-xs text-primary-400 flex items-center gap-1">
                      <IoLocationOutline className="text-secondary-400" />
                      {activePhoto.location}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">{activePhoto.title}</h3>
                  <p className="text-sm text-primary-300 mt-1 max-w-2xl">{activePhoto.description}</p>
                </div>
                <Link
                  to="/gallery"
                  className="px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
                >
                  View Full Gallery
                  <IoArrowForward />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CORE VALUES (SPOTLIGHT CARDS) ─── */}
      <section className="py-20 md:py-28 bg-primary-50/60 border-t border-primary-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-secondary-600 font-bold text-xs tracking-widest uppercase block mb-2">
              What We Stand For
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-950 tracking-tight">
              Our Core <span className="text-secondary-500">Values</span>
            </h2>
            <p className="text-primary-600 text-base md:text-lg mt-3">
              The fundamental principles steering every pass, every whistle, and every community
              program we coordinate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <SpotlightCard
                  key={idx}
                  className="p-8 sm:p-10 bg-white border border-primary-200 shadow-sm hover:shadow-xl transition-all duration-300 group"
                  spotlightColor="rgba(254, 87, 35, 0.12)"
                  borderColor="rgba(254, 87, 35, 0.5)"
                >
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-100 text-secondary-600 flex items-center justify-center text-3xl group-hover:bg-secondary-500 group-hover:text-white transition-all duration-300 flex-shrink-0 shadow-sm">
                      <Icon />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-primary-950 group-hover:text-secondary-600 transition-colors">
                          {val.title}
                        </h3>
                        <span className="text-2xl font-black text-primary-200 group-hover:text-secondary-300 transition-colors">
                          {val.number}
                        </span>
                      </div>
                      <p className="text-primary-600 leading-relaxed text-sm sm:text-base">
                        {val.description}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── JOURNEY / TIMELINE ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-secondary-600 font-bold text-xs tracking-widest uppercase block mb-2">
              How We Grew
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-950 tracking-tight">
              Our Journey So <span className="text-secondary-500">Far</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline center line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-secondary-400 via-secondary-500 to-tertiary-500 -translate-x-1/2" />

            <div className="space-y-10 md:space-y-16">
              {timelineMilestones.map((m, i) => {
                const isEven = i % 2 === 0;
                return (
                  <motion.div
                    key={i}
                    className={`relative flex flex-col md:flex-row items-center ${
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    {/* Content Box */}
                    <div className="w-full md:w-1/2 md:px-8">
                      <div
                        className={`bg-white p-6 sm:p-8 rounded-3xl border border-primary-200 shadow-sm hover:shadow-lg transition-shadow ${
                          isEven ? "md:text-right" : "md:text-left"
                        }`}
                      >
                        <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-600 font-black text-xs rounded-full uppercase mb-2">
                          {m.year}
                        </span>
                        <h4 className="text-xl font-bold text-primary-950 mb-2">{m.title}</h4>
                        <p className="text-primary-600 text-sm leading-relaxed">{m.description}</p>
                      </div>
                    </div>

                    {/* Timeline Node Center Badge */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-secondary-500 shadow-md items-center justify-center text-secondary-600 text-xs font-bold">
                      {i + 1}
                    </div>

                    {/* Spacer for the opposite side */}
                    <div className="hidden md:block w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FULL-WIDTH DRIFTWALL COMMUNITY SECTION ─── */}
      <section className="w-full relative my-12 bg-[#060010] py-16 md:py-24 overflow-hidden border-y border-primary-900/40">
        <div className="max-w-6xl mx-auto px-6 text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-secondary-500/20 text-secondary-400 border border-secondary-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <IoFootballOutline className="text-sm" /> The Movement In Pictures
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
              Our Community in <span className="text-secondary-500">Motion</span>
            </h2>
            <p className="text-base md:text-lg text-primary-300 leading-relaxed font-light max-w-3xl mx-auto">
              Thousands of players, passionate families, and sports enthusiasts trust The Arena
              every week. Together, we are writing a new chapter for Ethiopian grassroots football.
            </p>
          </motion.div>
        </div>

        <div className="w-full h-[580px] md:h-[680px] relative overflow-hidden">
          <DriftWall
            items={communityMoments}
            columns={7}
            tileWidth={210}
            tileHeight={138}
            gap={20}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#060010"
          />
        </div>
      </section>

      {/* ─── CIVIC PARTNERS & ALLIES ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-primary-500 font-bold mb-8">
            Proudly Collaborating with Regional Allies &amp; Community Organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {partners.map((partner, i) => (
              <div
                key={i}
                className="px-5 py-3 rounded-2xl bg-primary-100/70 border border-primary-200/80 text-primary-800 font-bold text-xs sm:text-sm shadow-xs hover:border-secondary-400 hover:text-secondary-600 transition-colors"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION (CTA) ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-primary-950 p-8 sm:p-14 md:p-20 text-center text-white border border-primary-800 shadow-2xl">
            {/* Background Image with Dark Vignette */}
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-luminosity"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&fit=crop&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/80 to-transparent" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-block px-3.5 py-1 bg-secondary-500/20 text-secondary-400 border border-secondary-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                Ready to Rumble?
              </span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                Step Onto The Pitch with{" "}
                <span className="text-secondary-500">The Arena</span>
              </h2>

              <p className="text-primary-300 text-base md:text-lg mb-10 leading-relaxed font-light">
                Whether you want to enter your team in our next Addis or Hawassa championship, enroll in
                our youth clinics, or partner with us as a civic sponsor—your journey starts here.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/events"
                  className="w-full sm:w-auto px-8 py-3.5 bg-secondary-500 text-white font-bold rounded-full hover:bg-secondary-600 transition-all duration-300 text-sm tracking-wide shadow-lg shadow-secondary-500/30 hover:scale-102 flex items-center justify-center gap-2"
                >
                  <IoFootballOutline className="text-lg" />
                  View Upcoming Tournaments
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 transition-all duration-300 text-sm tracking-wide hover:scale-102 flex items-center justify-center gap-2"
                >
                  Contact Our Organizers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;