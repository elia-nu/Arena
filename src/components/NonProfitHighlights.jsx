import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { nonprofitAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "./NotificationProvider";
import EmptyState from "./EmptyState";
import { absoluteMediaSrc, getOptimizedImageSrc } from "../utils/mediaUtils";
import {
  FaImages,
  FaVideo,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
} from "react-icons/fa";

const resolveImageSrc = (url, { width = 960, quality = 72 } = {}) =>
  url
    ? getOptimizedImageSrc(absoluteMediaSrc(url) || url, { width, quality })
    : url;

const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const match =
        url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/) ||
        url.match(/embed\/([^?]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    if (url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : url;
    }
    return url;
  } catch {
    return url;
  }
};

const NonProfitHighlights = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [galleryIndexByActivity, setGalleryIndexByActivity] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await nonprofitAPI.getAll({
          status: "published",
          limit: 20,
        });

        const items = (data.activities || []).map((a) => {
          const rawImages =
            a.images?.length > 0
              ? a.images
              : a.type === "image" && a.mediaUrl
                ? [a.mediaUrl]
                : a.thumbnailUrl
                  ? [a.thumbnailUrl]
                  : [];
          const images = rawImages.map((url) => resolveImageSrc(url));
          const mainImage =
            images[0] ||
            "https://images.unsplash.com/photo-1517840933442-d2d1a05edb84?w=800&h=600&fit=crop";
          const sponsor = a.sponsor
            ? {
                ...a.sponsor,
                logo: a.sponsor.logo
                  ? resolveImageSrc(a.sponsor.logo, { width: 160, quality: 80 })
                  : a.sponsor.logo,
              }
            : a.sponsor;
          return {
            id: a._id,
            title: a.title,
            description:
              a.description ||
              "Join our community non-profit activities and make an impact.",
            date: a.date,
            venue: a.venue || "TBA",
            image: mainImage,
            images,
            videos: a.videos || [],
            sponsor,
            badge: a.isFeatured ? "Featured" : "Community",
            type: a.type,
            mediaUrl: a.mediaUrl,
            participantCount: Array.isArray(a.participants)
              ? a.participants.length
              : 0,
          };
        });

        setActivities(items);
      } catch (err) {
        console.error("Failed to load non profit activities:", err);
        setError(
          err.message ||
            "Unable to load non profit activities. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const upcomingActivities = useMemo(
    () => activities.filter((a) => !a.date || new Date(a.date) >= new Date()),
    [activities],
  );

  const handleJoin = async (activityId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setJoiningId(activityId);
      await nonprofitAPI.join(activityId);
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                participantCount: (activity.participantCount || 0) + 1,
              }
            : activity,
        ),
      );
      showSuccess("You have successfully joined this activity.");
    } catch (err) {
      console.error("Failed to join activity:", err);
      showError(
        err.message || "Failed to join this activity. Please try again later.",
      );
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 lg:px-8 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary-100/60 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-14 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-5"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 px-5 py-2 border border-primary-950/10 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <motion.div
                className="w-2 h-2 bg-secondary-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-primary-950 text-xs font-medium tracking-[0.2em] uppercase">
                Non Profit Activities
              </span>
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl mb-4 font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="text-primary-950">Give Back </span>
            <span className="text-secondary-500">to the Community</span>
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join our non-profit activities, volunteering events, and community
            outreach programs organized through The Arena.
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="h-56 bg-primary-100 animate-pulse" />
                <div className="p-6">
                  <div className="h-6 bg-primary-200 rounded mb-3 animate-pulse" />
                  <div className="h-4 bg-primary-200 rounded mb-3 animate-pulse" />
                  <div className="h-4 bg-primary-200 rounded mb-5 animate-pulse" />
                  <div className="h-10 bg-primary-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            variant="error"
            title="Unable to load activities"
            description={error}
            actionLabel="Explore community impact"
            actionTo="/community-impact"
          />
        ) : activities.length === 0 ? (
          <EmptyState
            variant="nonprofit"
            title="Community activities coming soon"
            description="Volunteer days, youth programs, and non-profit events will appear here. Join us in making an impact."
            actionLabel="See our impact"
            actionTo="/community-impact"
          />
        ) : (
          <div>
            <h3 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-secondary-500" />
              Upcoming Activities
            </h3>
            {upcomingActivities.length === 0 ? (
              <EmptyState
                variant="nonprofit"
                title="No upcoming activities"
                description="Nothing on the calendar right now — check back soon for new volunteer and community events."
                actionLabel="See our impact"
                actionTo="/community-impact"
                className="py-8"
              />
            ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
                  {upcomingActivities.map((a, index) => (
                    <motion.div
                      key={a.id}
                      className="group relative bg-white border border-primary-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-secondary-500/50 transition-all duration-300"
                      onMouseEnter={() => setHoveredIndex(`upcoming-${index}`)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                    >
                      <div className="relative h-56 overflow-hidden bg-primary-100">
                        {a.image && (
                          <motion.img
                            src={
                              a.images?.length > 0 && expandedId === a.id
                                ? a.images[
                                    (galleryIndexByActivity[a.id] ?? 0) %
                                      a.images.length
                                  ]
                                : a.image
                            }
                            alt={a.title}
                            className="w-full h-full object-cover"
                            animate={{
                              scale:
                                hoveredIndex === `upcoming-${index}` ? 1.1 : 1,
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/75 via-primary-950/30 to-transparent" />

                        {a.badge && (
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-secondary-400 text-primary-950 shadow">
                            {a.badge}
                          </div>
                        )}
                        {a.sponsor?.logo && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                            <img
                              src={a.sponsor.logo}
                              alt={a.sponsor.name || "Sponsor"}
                              className="h-8 w-auto object-contain max-w-[80px]"
                            />
                            {a.sponsor.name && (
                              <span className="text-xs font-medium text-primary-900 truncate max-w-[100px]">
                                {a.sponsor.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-950 mb-2 group-hover:text-secondary-600 transition-colors">
                          {a.title}
                        </h3>
                        <p className="text-sm text-primary-600 mb-4 line-clamp-2">
                          {a.description}
                        </p>

                        <div className="space-y-1 text-sm text-primary-700 mb-4">
                          {a.date && (
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-secondary-400" />
                              <span>
                                {new Date(a.date).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                          {a.venue && (
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-tertiary-400" />
                              <span>{a.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FaUsers className="w-3.5 h-3.5 text-primary-500" />
                            <span>
                              {a.participantCount || 0} participant
                              {(a.participantCount || 0) === 1 ? "" : "s"}{" "}
                              joined
                            </span>
                          </div>
                        </div>

                        {(a.images?.length > 1 || a.videos?.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedId(expandedId === a.id ? null : a.id);
                              if (expandedId !== a.id) {
                                setGalleryIndexByActivity((prev) => ({
                                  ...prev,
                                  [a.id]: 0,
                                }));
                              }
                            }}
                            className="flex items-center gap-2 w-full mb-3 px-3 py-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-medium"
                          >
                            {expandedId === a.id ? (
                              <>
                                <FaChevronUp className="w-4 h-4" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <FaChevronDown className="w-4 h-4" />
                                View images & videos
                                {a.images?.length > 1 && (
                                  <span className="text-primary-500">
                                    ({a.images.length} images)
                                  </span>
                                )}
                                {a.videos?.length > 0 && (
                                  <span className="text-primary-500">
                                    ({a.videos.length} videos)
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        )}

                        <AnimatePresence>
                          {expandedId === a.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-primary-100 pt-4 mb-4 space-y-4"
                            >
                              {a.sponsor?.name && (
                                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                                  {a.sponsor.logo && (
                                    <img
                                      src={a.sponsor.logo}
                                      alt={a.sponsor.name}
                                      className="h-10 w-auto object-contain"
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs text-primary-500">
                                      Sponsored by
                                    </p>
                                    <a
                                      href={a.sponsor.url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-semibold text-primary-900 hover:text-secondary-600"
                                    >
                                      {a.sponsor.name}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {a.images?.length > 1 && (
                                <div>
                                  <p className="text-xs font-semibold text-primary-700 mb-2 flex items-center gap-1">
                                    <FaImages className="w-3.5 h-3.5" />
                                    Gallery ({a.images.length})
                                  </p>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {a.images.map((img, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() =>
                                          setGalleryIndexByActivity((prev) => ({
                                            ...prev,
                                            [a.id]: i,
                                          }))
                                        }
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                          (galleryIndexByActivity[a.id] ??
                                            0) === i
                                            ? "border-secondary-400"
                                            : "border-primary-200"
                                        }`}
                                      >
                                        <img
                                          src={img}
                                          alt={`${a.title} ${i + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {a.videos?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-primary-700 mb-2 flex items-center gap-1">
                                    <FaVideo className="w-3.5 h-3.5" />
                                    Videos
                                  </p>
                                  <div className="space-y-3">
                                    {a.videos.filter(Boolean).map((url, i) => {
                                      const embed = getEmbedUrl(url);
                                      return embed ? (
                                        <div
                                          key={i}
                                          className="aspect-video rounded-lg overflow-hidden bg-black"
                                        >
                                          <iframe
                                            src={embed}
                                            title={`Video ${i + 1}`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="button"
                          onClick={() => handleJoin(a.id)}
                          disabled={joiningId === a.id}
                          className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary-950 text-white hover:bg-secondary-500 hover:text-white disabled:opacity-60 transition-all duration-300 shadow-xs hover:shadow-md"
                        >
                          {joiningId === a.id
                            ? "Joining..."
                            : "Join This Activity"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
            </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NonProfitHighlights;
