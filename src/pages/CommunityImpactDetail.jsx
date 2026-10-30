import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { communityImpactAPI } from "../services/api";
import {
  IoArrowBack,
  IoCalendarOutline,
  IoClose,
  IoLocationOutline,
  IoImageOutline,
  IoVideocamOutline,
  IoBusinessOutline,
  IoOpenOutline,
  IoPlayCircle,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import {
  absoluteMediaSrc,
  getOptimizedImageSrc,
  isDirectVideoFileUrl,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
} from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&h=900&fit=crop&fm=webp&q=80";

const optimizedDisplaySrc = (url, opts) =>
  getOptimizedImageSrc(absoluteMediaSrc(url) || url, opts);

const getVideoRenderData = (url) => {
  if (!url) return null;
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return {
        kind: "embed",
        src: getYouTubeEmbedUrl(url),
        thumb: (() => {
          const id = parseYouTubeUrl(url);
          return id ? getYouTubeThumbnail(id, "hqdefault") : null;
        })(),
      };
    }
    if (url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return {
        kind: "embed",
        src: match ? `https://player.vimeo.com/video/${match[1]}` : url,
        thumb: null,
      };
    }
    if (isDirectVideoFileUrl(url) || String(url).startsWith("/uploads/")) {
      return { kind: "direct", src: absoluteMediaSrc(url) || url, thumb: null };
    }
    return { kind: "external", src: absoluteMediaSrc(url) || url, thumb: null };
  } catch {
    return { kind: "external", src: absoluteMediaSrc(url) || url, thumb: null };
  }
};

const CommunityImpactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [readyVideoMap, setReadyVideoMap] = useState({});

  const videosWithUrl = useMemo(
    () => activity?.videos?.filter((video) => video?.url) || [],
    [activity?.videos],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await communityImpactAPI.getById(id);
        const a = res.entry;
        if (!a) {
          setActivity(null);
          return;
        }
        const images =
          a.images?.length > 0
            ? a.images
            : a.type === "image" && a.mediaUrl
              ? [a.mediaUrl]
              : a.thumbnailUrl
                ? [a.thumbnailUrl]
                : [];
        const mainImage = images[0] || FALLBACK_IMAGE;
        setActivity({
          ...a,
          images,
          mainImage,
          videos: (a.videos || []).map((video) =>
            typeof video === "string"
              ? { url: video, sourceType: "url" }
              : video,
          ),
        });
        setSelectedImageIndex(0);
        setReadyVideoMap({});
      } catch (err) {
        console.error("Failed to load activity:", err);
        setActivity(null);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") setIsImageModalOpen(false);
      if (event.key === "ArrowRight" && activity?.images?.length > 1) {
        setSelectedImageIndex((i) => (i + 1) % activity.images.length);
      }
      if (event.key === "ArrowLeft" && activity?.images?.length > 1) {
        setSelectedImageIndex(
          (i) => (i - 1 + activity.images.length) % activity.images.length,
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isImageModalOpen, activity?.images?.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-secondary-200 border-t-secondary-500 rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 pb-16">
        <EmptyState
          variant="nonprofit"
          title="Story not found"
          description="This community impact story may have been removed or the link is no longer valid."
          actionLabel="Back to community impact"
          actionTo="/community-impact"
        />
      </div>
    );
  }

  const heroSrc = optimizedDisplaySrc(
    activity.images?.[selectedImageIndex] || activity.mainImage,
    { width: 1800, quality: 78 },
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white pt-20 pb-24 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-32 -left-20 w-80 h-80 rounded-full bg-secondary-200/20 blur-3xl" />
        <div className="absolute bottom-40 -right-16 w-72 h-72 rounded-full bg-tertiary-200/15 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <motion.button
          onClick={() => navigate("/community-impact")}
          className="mb-8 flex items-center gap-3 px-5 py-3 rounded-xl bg-white/80 backdrop-blur-md border border-primary-200/50 text-primary-700 hover:text-secondary-600 hover:bg-white hover:border-secondary-300 hover:shadow-lg transition-all duration-300 group shadow-sm"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <IoArrowBack className="w-5 h-5 group-hover:text-secondary-600 transition-colors" />
          <span className="font-semibold">Back to Community Impact</span>
        </motion.button>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-10 lg:mb-14"
        >
          <div className="relative h-[360px] sm:h-[420px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImageIndex}
                src={heroSrc}
                alt={activity.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-primary-950/35 via-primary-950/55 to-primary-950/95" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-transparent to-primary-950/30" />

            <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
              <span
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 ${
                  activity.isFeatured
                    ? "bg-secondary-500 text-white"
                    : "bg-primary-800/90 text-white"
                }`}
              >
                {activity.isFeatured ? "Featured" : "Community Impact"}
              </span>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-8">
              <motion.h1
                className="text-3xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl leading-tight tracking-tight max-w-4xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {activity.title}
              </motion.h1>
              {activity.date && (
                <motion.p
                  className="text-white/85 text-sm sm:text-base uppercase tracking-[0.2em] mt-3 font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {new Date(activity.date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </motion.p>
              )}
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {activity.description && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-primary-200/60"
              >
                <h2 className="text-xl font-bold text-primary-950 mb-4">
                  The story
                </h2>
                <p className="text-primary-700 leading-relaxed whitespace-pre-line text-base md:text-[17px]">
                  {activity.description}
                </p>
              </motion.section>
            )}

            {activity.images?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-primary-200/60"
              >
                <div className="flex items-center gap-3 mb-6">
                  <IoImageOutline className="w-6 h-6 text-secondary-500" />
                  <h2 className="text-xl font-bold text-primary-950">
                    Photo gallery
                  </h2>
                  <span className="text-sm text-primary-500">
                    ({activity.images.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {activity.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(i);
                        setIsImageModalOpen(true);
                      }}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all group ${
                        selectedImageIndex === i
                          ? "border-secondary-500 ring-2 ring-secondary-400/30"
                          : "border-primary-200 hover:border-secondary-400"
                      }`}
                    >
                      <img
                        src={optimizedDisplaySrc(img, {
                          width: 480,
                          quality: 68,
                        })}
                        alt={`${activity.title} ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-primary-950/0 group-hover:bg-primary-950/20 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {videosWithUrl.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-primary-200/60"
              >
                <div className="flex items-center gap-3 mb-6">
                  <IoVideocamOutline className="w-6 h-6 text-secondary-500" />
                  <h2 className="text-xl font-bold text-primary-950">Videos</h2>
                  <span className="text-sm text-primary-500">
                    ({videosWithUrl.length})
                  </span>
                </div>
                <div className="space-y-6">
                  {videosWithUrl.map((video, i) => {
                    const renderData = getVideoRenderData(video.url);
                    if (!renderData) return null;
                    const readyKey =
                      renderData.kind === "embed" ? `embed-${i}` : String(i);
                    const isReady = !!readyVideoMap[readyKey];

                    return (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden border border-primary-200 shadow-lg"
                      >
                        <div className="aspect-video bg-primary-950 relative">
                          {renderData.kind === "embed" ? (
                            isReady ? (
                              <iframe
                                src={renderData.src}
                                title={`${activity.title} video ${i + 1}`}
                                className="w-full h-full"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setReadyVideoMap((prev) => ({
                                    ...prev,
                                    [readyKey]: true,
                                  }))
                                }
                                className="group absolute inset-0 flex items-center justify-center"
                                title="Play video"
                              >
                                {renderData.thumb && (
                                  <img
                                    src={renderData.thumb}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />
                                <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/50 px-6 py-3 text-sm font-semibold text-white transition group-hover:bg-secondary-500 group-hover:border-secondary-400">
                                  <IoPlayCircle className="w-6 h-6" />
                                  Play video
                                </span>
                              </button>
                            )
                          ) : renderData.kind === "direct" ? (
                            isReady ? (
                              <video
                                controls
                                playsInline
                                preload="none"
                                controlsList="nodownload"
                                autoPlay
                                className="w-full h-full"
                                title={`${activity.title} video ${i + 1}`}
                              >
                                <source src={renderData.src} />
                              </video>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setReadyVideoMap((prev) => ({
                                    ...prev,
                                    [readyKey]: true,
                                  }))
                                }
                                className="group absolute inset-0 flex items-center justify-center"
                                title="Play video"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />
                                <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/50 px-6 py-3 text-sm font-semibold text-white transition group-hover:bg-secondary-500">
                                  <IoPlayCircle className="w-6 h-6" />
                                  Play video
                                </span>
                              </button>
                            )
                          ) : (
                            <a
                              href={renderData.src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-full w-full flex items-center justify-center text-white/90 hover:text-white transition-colors"
                            >
                              Open video
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5 lg:sticky lg:top-28 self-start"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-200/60 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                  <IoCalendarOutline className="w-5 h-5 text-secondary-500" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary-500 mb-1">
                    When
                  </p>
                  <p className="text-primary-950 font-semibold leading-snug">
                    {activity.date
                      ? new Date(activity.date).toLocaleString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "TBA"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-primary-100" />

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-tertiary-100 flex items-center justify-center shrink-0">
                  <IoLocationOutline className="w-5 h-5 text-tertiary-500" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary-500 mb-1">
                    Where
                  </p>
                  <p className="text-primary-950 font-semibold leading-snug">
                    {activity.place || "TBA"}
                  </p>
                </div>
              </div>
            </div>

            {activity.sponsor?.name && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-200/60">
                <p className="text-xs uppercase tracking-wider text-primary-500 mb-4 flex items-center gap-2">
                  <IoBusinessOutline className="w-4 h-4" />
                  Partner
                </p>
                <div className="flex flex-col gap-4">
                  {activity.sponsor.logo && (
                    <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4 flex items-center justify-center">
                      <img
                        src={optimizedDisplaySrc(activity.sponsor.logo, {
                          width: 280,
                          quality: 80,
                        })}
                        alt={activity.sponsor.name}
                        className="max-h-16 w-auto object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div>
                    {activity.sponsor.website ? (
                      <a
                        href={activity.sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-primary-950 hover:text-secondary-600 transition-colors inline-flex items-center gap-2"
                      >
                        {activity.sponsor.name}
                        <IoOpenOutline className="w-4 h-4 opacity-70" />
                      </a>
                    ) : (
                      <p className="text-lg font-bold text-primary-950">
                        {activity.sponsor.name}
                      </p>
                    )}
                    {activity.sponsor.website && (
                      <p className="text-sm text-primary-500 mt-1">
                        Visit partner website
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      </div>

      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/90 px-4 py-8 md:p-8 flex items-center justify-center"
            onClick={() => setIsImageModalOpen(false)}
          >
            <button
              type="button"
              aria-label="Close image preview"
              className="absolute top-4 right-4 md:top-6 md:right-6 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors z-10"
              onClick={() => setIsImageModalOpen(false)}
            >
              <IoClose className="w-5 h-5" />
            </button>

            {activity.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(
                      (i) =>
                        (i - 1 + activity.images.length) %
                        activity.images.length,
                    );
                  }}
                >
                  <IoChevronBack className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(
                      (i) => (i + 1) % activity.images.length,
                    );
                  }}
                >
                  <IoChevronForward className="w-6 h-6" />
                </button>
              </>
            )}

            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              src={optimizedDisplaySrc(
                activity.images?.[selectedImageIndex] || activity.mainImage,
                { width: 1800, quality: 82 },
              )}
              alt={`${activity.title} preview`}
              className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityImpactDetail;
