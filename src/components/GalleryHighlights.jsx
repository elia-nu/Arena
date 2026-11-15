import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { mediaAPI } from "../services/api";
import {
  absoluteMediaSrc,
  getOptimizedImageSrc,
  isDirectVideoFileUrl,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  detectVideoPlatform,
  isTournamentScopedMedia,
} from "../utils/mediaUtils";
import LightboxViewer from "./gallery/LightboxViewer";
import FloatingLines from "./FloatingLines";
import DriftWall from "./reactbits/DriftWall";
import {
  FaPlay,
  FaImages,
  FaVideo,
  FaArrowRight,
  FaFire,
  FaCompass,
} from "react-icons/fa";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&fm=webp&q=80";

const DEFAULT_HIGHLIGHTS = [
  {
    _id: "fb-1",
    event: "Championship Street Final",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&q=80",
    location: "Main Court",
    description: "High-octane tournament final under the neon arena floodlights.",
  },
  {
    _id: "fb-2",
    event: "Golden Goal Celebration",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=1000&fit=crop&q=80",
    location: "Center Ring",
    description: "Pure euphoria as the deciding strike hits the back of the net.",
  },
  {
    _id: "fb-3",
    event: "Street Panna Showdown",
    category: "highlights",
    type: "video",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=1000&fit=crop&q=80",
    location: "Cage 1",
    description: "Dazzling nutmegs and fast-paced 1v1 street soccer mastery.",
  },
  {
    _id: "fb-4",
    event: "Youth Development Academy",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&h=1000&fit=crop&q=80",
    location: "Community Pitch",
    description: "Empowering the next generation of players on and off the court.",
  },
  {
    _id: "fb-5",
    event: "Night Arena Atmosphere",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80",
    location: "Addis Ababa Pitch",
    description: "Electric atmosphere, packed sidelines, and relentless rhythm.",
  },
  {
    _id: "fb-6",
    event: "Freestyle Exhibition",
    category: "highlights",
    type: "video",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail:
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=1000&fit=crop&q=80",
    location: "Freestyle Stage",
    description: "Acrobatic ball tricks and impossible gravity-defying moves.",
  },
  {
    _id: "fb-7",
    event: "Urban Cage Match",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=1000&fit=crop&q=80",
    location: "Downtown Court",
    description: "Hardtop asphalt battles with neighborhood pride on the line.",
  },
  {
    _id: "fb-8",
    event: "Trophy Presentation",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=1000&fit=crop&q=80",
    location: "Podium",
    description: "Lifting the championship cup after grueling playoff matches.",
  },
  {
    _id: "fb-9",
    event: "Matchday Warmups",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&h=1000&fit=crop&q=80",
    location: "Warmup Zone",
    description: "Pre-game drills and team huddles ahead of the semi-finals.",
  },
  {
    _id: "fb-10",
    event: "High-Flying Sprint",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop&q=80",
    location: "Goalmouth",
    description: "Aerial duel decided in mid-air in front of hundreds of fans.",
  },
  {
    _id: "fb-11",
    event: "Pitch Corner Duel",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=1000&fit=crop&q=80",
    location: "Corner Arc",
    description: "Tense corner set-piece battle as attackers surge inside.",
  },
  {
    _id: "fb-12",
    event: "Stadium Arena Roar",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=1000&fit=crop&q=80",
    location: "Arena Grandstand",
    description: "Thousands of spectators cheering under blinding stadium lights.",
  },
  {
    _id: "fb-13",
    event: "Slide Tackle Decider",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=1000&fit=crop&q=80",
    location: "Midfield",
    description: "Flawless ball recovery stopping a dangerous counter-attack.",
  },
  {
    _id: "fb-14",
    event: "Squad Victory Huddle",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop&q=80",
    location: "Team Bench",
    description: "Shared camaraderie and bond after grinding out the win.",
  },
  {
    _id: "fb-15",
    event: "Stadium Pulse",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=1000&fit=crop&q=80",
    location: "Sidelines",
    description: "Fans drumming and chanting throughout extra time.",
  },
  {
    _id: "fb-16",
    event: "Night Turf Showdown",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=1000&fit=crop&q=80",
    location: "Turf Field",
    description: "Unrelenting tempo under the night floodlights.",
  },
  {
    _id: "fb-17",
    event: "Matchday Cleats & Ball",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&h=1000&fit=crop&q=80",
    location: "Locker Room",
    description: "The tools of the craft ready for the opening kickoff.",
  },
  {
    _id: "fb-18",
    event: "Strike in the Net",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=1000&fit=crop&q=80",
    location: "Top Bin",
    description: "Unstoppable curve finding the top corner of the goal net.",
  },
  {
    _id: "fb-19",
    event: "Tactical Masterplan",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=1000&fit=crop&q=80",
    location: "Strategy Board",
    description: "Final formation adjustments delivered before stepping onto the cage.",
  },
  {
    _id: "fb-20",
    event: "Silverware Glory",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&h=1000&fit=crop&q=80",
    location: "Trophy Table",
    description: "The coveted championship trophy gleaming under the lights.",
  },
  {
    _id: "fb-21",
    event: "City Street Clash",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?w=800&h=1000&fit=crop&q=80",
    location: "Downtown Asphalt",
    description: "Fast break across the city blacktop court.",
  },
  {
    _id: "fb-22",
    event: "Midfield Distribution",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&h=1000&fit=crop&q=80",
    location: "Center Circle",
    description: "Threaded passes unlocking stubborn defense lines.",
  },
  {
    _id: "fb-23",
    event: "Outdoor Pitch Rumble",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=1000&fit=crop&q=80",
    location: "Park Pitch",
    description: "End-to-end action in the community summer tournament.",
  },
  {
    _id: "fb-24",
    event: "Wall-Pass Combination",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800&h=1000&fit=crop&q=80",
    location: "Cage Perimeter",
    description: "Using the cage board for a lightning give-and-go assist.",
  },
  {
    _id: "fb-25",
    event: "Overhead Kick Stunner",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=1000&fit=crop&q=80",
    location: "Penalty Box",
    description: "Spectacular acrobatics leaving the keeper rooted to the spot.",
  },
  {
    _id: "fb-26",
    event: "Post-Match Jubilation",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&h=1000&fit=crop&q=80",
    location: "Pitch Center",
    description: "Teammates embracing as the final buzzer sounds.",
  },
  {
    _id: "fb-27",
    event: "Dribble Through Traffic",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=800&h=1000&fit=crop&q=80",
    location: "Flank",
    description: "Mesmerizing close control slicing past three defenders.",
  },
  {
    _id: "fb-28",
    event: "Street Cage Battle",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=1000&fit=crop&q=80",
    location: "Cage Arena",
    description: "Close-quarters physical football inside the steel fencing.",
  },
  {
    _id: "fb-29",
    event: "Crowd Chant Echo",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&h=1000&fit=crop&q=80",
    location: "Bleachers",
    description: "Singing and drumming in unison through all 90 minutes.",
  },
  {
    _id: "fb-30",
    event: "Street Soccer Showcase",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&h=1000&fit=crop&q=80",
    location: "Main Ring",
    description: "Raw street flair and expression on full display.",
  },
];

const resolveCover = (item) => {
  const isVideo = item.type === "video";
  const platform = isVideo
    ? item.platform || detectVideoPlatform(item.url || "")
    : null;

  const hasImageThumbnail =
    isVideo &&
    item.thumbnail &&
    typeof item.thumbnail === "string" &&
    !isDirectVideoFileUrl(item.thumbnail) &&
    (item.thumbnail.startsWith("http") || item.thumbnail.startsWith("/"));

  let coverSrc = null;

  if (!isVideo && item.url) {
    coverSrc = absoluteMediaSrc(item.url) || item.url;
  } else if (hasImageThumbnail) {
    coverSrc = absoluteMediaSrc(item.thumbnail) || item.thumbnail;
  } else if (isVideo && (platform === "youtube" || item.url)) {
    const vid = parseYouTubeUrl(item.url);
    if (vid) coverSrc = getYouTubeThumbnail(vid);
  }

  return {
    coverSrc: coverSrc
      ? getOptimizedImageSrc(coverSrc, { width: 720, quality: 75 })
      : null,
    isVideo,
  };
};

const FILTER_OPTIONS = [
  { id: "all", label: "All Media", icon: null },
  { id: "highlights", label: "Highlights", icon: FaFire },
  { id: "photos", label: "Photos", icon: FaImages },
  { id: "videos", label: "Videos", icon: FaVideo },
];

const GalleryHighlights = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const data = await mediaAPI.getAll({ visibility: "public" });
        if (isMounted) {
          const publicItems = (data.media || []).filter(
            (item) => item.visibility === "public" && !isTournamentScopedMedia(item)
          );

          if (publicItems.length > 0) {
            setMedia(publicItems);
          } else {
            setMedia([]);
          }
        }
      } catch (err) {
        console.error("Error fetching gallery highlights:", err);
        if (isMounted) {
          setMedia([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  const fullPool = useMemo(() => {
    return [...media, ...DEFAULT_HIGHLIGHTS];
  }, [media]);

  const filteredList = useMemo(() => {
    if (activeFilter === "all") return fullPool;
    if (activeFilter === "photos")
      return fullPool.filter((item) => item.type !== "video");
    if (activeFilter === "videos")
      return fullPool.filter((item) => item.type === "video");
    return fullPool.filter(
      (item) => item.category?.toLowerCase() === activeFilter
    );
  }, [fullPool, activeFilter]);

  // Format items for the 3D DriftWall component (minimum 25 items for rich, lush columns)
  const driftWallItems = useMemo(() => {
    const base = filteredList.length > 0 ? filteredList : DEFAULT_HIGHLIGHTS;
    let list = [...base];
    while (list.length < 25) {
      list = [...list, ...base];
    }

    return list.slice(0, 36).map((item, index) => {
      const { coverSrc, isVideo } = resolveCover(item);
      return {
        image: coverSrc || FALLBACK_IMAGE,
        title: item.event || item.description || `Arena Moment ${index + 1}`,
        isVideo,
        rawItem: item,
      };
    });
  }, [filteredList]);

  const selectedIndex = useMemo(() => {
    if (!selectedMedia) return -1;
    return filteredList.findIndex(
      (m) => (m._id || m.id) === (selectedMedia._id || selectedMedia.id)
    );
  }, [selectedMedia, filteredList]);

  const handlePrevLightbox = () => {
    if (selectedIndex > 0) {
      setSelectedMedia(filteredList[selectedIndex - 1]);
    } else {
      setSelectedMedia(filteredList[filteredList.length - 1]);
    }
  };

  const handleNextLightbox = () => {
    if (selectedIndex < filteredList.length - 1) {
      setSelectedMedia(filteredList[selectedIndex + 1]);
    } else {
      setSelectedMedia(filteredList[0]);
    }
  };

  return (
    <section className="py-24 md:py-32 px-4 md:px-6 lg:px-8 bg-neutral-950 text-white relative overflow-hidden">
      {/* React Bits Floating Lines Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <FloatingLines
          linesGradient={["#FE5723", "#FFA048", "#1E1B4B", "#FE5723"]}
          animationSpeed={0.9}
          interactive={true}
          parallax={true}
          bendRadius={5.0}
          bendStrength={-0.45}
          mixBlendMode="screen"
        />
      </div>

      {/* Atmospheric Overlays for optimal contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/40 to-neutral-950 pointer-events-none z-10" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary-500/10 rounded-full blur-[200px] pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto relative z-20">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            className="inline-block mb-5"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="flex items-center gap-3 px-6 py-2 border border-secondary-500/40 bg-secondary-500/10 backdrop-blur-md rounded-full shadow-lg shadow-secondary-500/10">
              <motion.div
                className="w-2 h-2 bg-secondary-400 rounded-full shadow-[0_0_8px_#FE5723]"
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-secondary-400 text-xs font-semibold tracking-[0.25em] uppercase">
                Interactive 3D Gallery
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            <span className="text-white">Captured in </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-500 to-amber-300">
              The Arena
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            Explore our visual archive in 3D motion. Hover to tilt the perspective,
            and click any tile to view high-resolution photography and match clips.
          </motion.p>

          {/* Filter Pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 mt-8"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            {FILTER_OPTIONS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-secondary-500 text-white shadow-lg shadow-secondary-500/25 ring-2 ring-secondary-400/50"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-sm"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* 3D Motion DriftWall Container */}
        <motion.div
          className="relative h-[480px] sm:h-[560px] md:h-[640px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950/60 backdrop-blur-sm mb-12"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DriftWall
              items={driftWallItems}
              columns={5}
              tileWidth={230}
              tileHeight={150}
              gap={16}
              radius={16}
              tilt={14}
              turn={-12}
              speed={38}
              parallax={0.7}
              dim={0.65}
              overlayColor="#07070d"
              onItemClick={(item) => setSelectedMedia(item.rawItem)}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />
          )}

          {/* Interactive Hint Pill in the 3D Wall */}
          <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none z-30">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950/80 border border-white/15 text-neutral-300 text-xs backdrop-blur-md shadow-lg">
              <FaCompass className="w-3.5 h-3.5 text-secondary-400 animate-spin-slow" />
              <span>Hover & drag to tilt in 3D • Click any tile to inspect</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA Bar */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/gallery"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm bg-gradient-to-r from-secondary-500 to-amber-500 hover:from-secondary-400 hover:to-amber-400 text-neutral-950 shadow-xl shadow-secondary-500/20 hover:shadow-secondary-500/35 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Explore Full Arena Gallery</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <LightboxViewer
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onPrev={handlePrevLightbox}
            onNext={handleNextLightbox}
            hasPrev={filteredList.length > 1}
            hasNext={filteredList.length > 1}
            positionLabel={
              selectedIndex >= 0
                ? `${selectedIndex + 1} of ${filteredList.length}`
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default GalleryHighlights;
