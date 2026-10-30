import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPlayCircle,
  IoVideocamOutline,
} from "react-icons/io5";
import { communityImpactAPI } from "../services/api";
import {
  absoluteMediaSrc,
  getOptimizedImageSrc,
  parseYouTubeUrl,
  getYouTubeThumbnail,
} from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop&fm=webp&q=80";

const resolveCover = (entry) => {
  const firstImage = entry?.images?.[0];
  if (firstImage) {
    return getOptimizedImageSrc(absoluteMediaSrc(firstImage) || firstImage, {
      width: 960,
      quality: 72,
    });
  }

  const firstVideoUrl = entry?.videos?.find((v) => v?.url)?.url;
  if (firstVideoUrl) {
    const ytId = parseYouTubeUrl(firstVideoUrl);
    if (ytId) return getYouTubeThumbnail(ytId, "hqdefault");
  }

  return FALLBACK_IMAGE;
};

const formatDate = (date) => {
  if (!date) return "Date TBA";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CommunityImpact = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await communityImpactAPI.getAll({
          status: "published",
          limit: 40,
        });
        setEntries(data.entries || []);
      } catch (err) {
        setError(err.message || "Unable to load community impact stories.");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "featured") return entries.filter((e) => e.isFeatured);
    if (filter === "video")
      return entries.filter((e) =>
        (e.videos || []).some((v) => v?.url),
      );
    return entries;
  }, [entries, filter]);

  const filters = [
    { id: "all", label: "All stories" },
    { id: "featured", label: "Featured" },
    { id: "video", label: "With video" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-24 right-1/4 w-96 h-96 bg-tertiary-200/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.25, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="flex items-center gap-3 px-5 py-2.5 border border-primary-950/10 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <motion.div
                className="w-2 h-2 bg-secondary-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-primary-950 text-xs font-medium tracking-[0.2em] uppercase">
                Community Impact
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
          >
            <span className="text-primary-950">Stories that </span>
            <span className="text-secondary-500">move us</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            Street soccer clinics, youth mentorship, and partner programs
            building stronger neighborhoods across Greater Seattle.
          </motion.p>
        </motion.div>

        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                    active
                      ? "bg-secondary-500 text-white shadow-sm"
                      : "bg-white border border-primary-200 text-primary-700 hover:border-secondary-300 hover:text-secondary-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-primary-600 font-medium">
            <span className="text-secondary-600 font-semibold">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "story" : "stories"}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="h-56 bg-primary-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-primary-200 rounded animate-pulse" />
                  <div className="h-4 bg-primary-200 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-primary-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            variant="error"
            title="Unable to load stories"
            description={error}
            actionLabel="Back to home"
            actionTo="/"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="nonprofit"
            title="Stories coming soon"
            description="Community impact stories and partner highlights will appear here soon."
            actionLabel="Back to home"
            actionTo="/"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {filtered.map((entry, index) => {
              const cover = resolveCover(entry);
              const hasVideo = (entry.videos || []).some((v) => v?.url);
              const imageCount = entry.images?.length || 0;

              return (
                <motion.article
                  key={entry._id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/community-impact/${entry._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/community-impact/${entry._id}`);
                    }
                  }}
                  className="group relative bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col cursor-pointer"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.55,
                    delay: Math.min(index * 0.06, 0.36),
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -10, scale: 1.015 }}
                >
                  <div className="relative h-56 md:h-60 overflow-hidden bg-primary-100">
                    <motion.img
                      src={cover}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          entry.isFeatured
                            ? "bg-secondary-500 text-white"
                            : "bg-white/90 text-primary-900"
                        }`}
                      >
                        {entry.isFeatured ? "Featured" : "Impact"}
                      </span>
                      {hasVideo && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/55 text-white backdrop-blur-sm">
                          <IoVideocamOutline className="w-3.5 h-3.5" />
                          Video
                        </span>
                      )}
                    </div>

                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <IoPlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                      </div>
                    )}

                    {imageCount > 1 && (
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-black/55 text-white backdrop-blur-sm">
                        {imageCount} photos
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6 md:p-7">
                    {entry.sponsor?.name && (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500 mb-2">
                        With {entry.sponsor.name}
                      </p>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-primary-950 leading-snug tracking-tight line-clamp-2 mb-3 group-hover:text-secondary-600 transition-colors">
                      {entry.title}
                    </h2>
                    <p className="text-sm text-primary-600 leading-relaxed line-clamp-3 mb-5 flex-1">
                      {entry.description ||
                        "See how we’re making a difference in the community."}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 text-xs text-primary-600">
                      <span className="inline-flex items-center gap-1.5">
                        <IoCalendarOutline className="w-4 h-4 text-secondary-500" />
                        {formatDate(entry.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <IoLocationOutline className="w-4 h-4 text-tertiary-500 shrink-0" />
                        <span className="truncate">{entry.place || "TBA"}</span>
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityImpact;
