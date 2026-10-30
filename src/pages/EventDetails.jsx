import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tournamentAPI, matchAPI, mediaAPI } from "../services/api";
import { useNotification } from "../components/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import RegistrationModal from "../components/events/RegistrationModal";
import LightboxViewer from "../components/gallery/LightboxViewer";
import CountdownTimer from "../components/CountdownTimer";
import {
  IoArrowBack,
  IoCalendar,
  IoLocation,
  IoPeople,
  IoCash,
  IoTime,
  IoTrophy,
  IoFlag,
  IoShieldCheckmark,
  IoCheckmarkCircle,
  IoStar,
  IoInformationCircle,
  IoGlobe,
  IoPlayCircle,
} from "react-icons/io5";
import EmptyState from "../components/EmptyState";
import {
  absoluteMediaSrc,
  isDirectVideoFileUrl,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  detectVideoPlatform,
} from "../utils/mediaUtils";

function VideoTilePlaceholder() {
  return (
    <div className="w-full h-40 bg-gradient-to-br from-primary-800 to-primary-950 flex items-center justify-center">
      <IoPlayCircle
        className="w-16 h-16 text-white/90 drop-shadow-md"
        aria-hidden
      />
    </div>
  );
}

function EventMediaTileCover({ item }) {
  const directVideo =
    item.type === "video" &&
    (item.platform === "direct" || isDirectVideoFileUrl(item.url));

  // Do not use <video> on the grid: loading the file on page open can trigger a
  // download if MIME/disposition is wrong or the URL hits the dev server. Use a
  // poster image when present, otherwise a static placeholder; playback is in the lightbox.
  if (directVideo) {
    const th = item.thumbnail;
    if (
      th &&
      typeof th === "string" &&
      !isDirectVideoFileUrl(th) &&
      (th.startsWith("http") || th.startsWith("/"))
    ) {
      const src = absoluteMediaSrc(th) || th;
      return (
        <img
          src={src}
          alt=""
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    }
    return <VideoTilePlaceholder />;
  }

  if (item.type === "video") {
    const platform = item.platform || detectVideoPlatform(item.url || "");

    if (platform === "youtube" && item.url) {
      const vid = parseYouTubeUrl(item.url);
      const thumb =
        item.thumbnail &&
        typeof item.thumbnail === "string" &&
        !isDirectVideoFileUrl(item.thumbnail) &&
        (item.thumbnail.startsWith("http") || item.thumbnail.startsWith("/"))
          ? item.thumbnail
          : vid
            ? getYouTubeThumbnail(vid)
            : "";
      if (thumb) {
        const src = absoluteMediaSrc(thumb) || thumb;
        return (
          <img
            src={src}
            alt=""
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        );
      }
      return <VideoTilePlaceholder />;
    }

    if (platform === "tiktok") {
      const th = item.thumbnail;
      if (
        th &&
        typeof th === "string" &&
        (th.startsWith("http") || th.startsWith("/")) &&
        !isDirectVideoFileUrl(th)
      ) {
        const src = absoluteMediaSrc(th) || th;
        return (
          <img
            src={src}
            alt=""
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        );
      }
      return <VideoTilePlaceholder />;
    }

    if (item.thumbnail && isDirectVideoFileUrl(item.thumbnail)) {
      return <VideoTilePlaceholder />;
    }

    const raw = item.thumbnail || item.url;
    if (
      raw &&
      (String(raw).includes("youtube.com") || String(raw).includes("youtu.be"))
    ) {
      const vid = parseYouTubeUrl(String(raw));
      if (vid) {
        const src = getYouTubeThumbnail(vid);
        return (
          <img
            src={src}
            alt=""
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        );
      }
    }

    if (
      raw &&
      String(raw).includes("tiktok.com") &&
      !String(raw).match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
    ) {
      return <VideoTilePlaceholder />;
    }
  }

  const raw = item.type === "video" ? item.thumbnail || item.url : item.url;
  if (!raw) {
    return item.type === "video" ? (
      <VideoTilePlaceholder />
    ) : (
      <div className="w-full h-40 bg-primary-100" />
    );
  }

  const src = absoluteMediaSrc(raw) || raw;
  return (
    <img
      src={src}
      alt=""
      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

const EventDetails = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { isAuthenticated, isTeamLeader, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventMedia, setEventMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const getEventStatusFromDates = (startDate, endDate) => {
    const endTimestamp = endDate ? new Date(endDate).getTime() : null;
    const startTimestamp = startDate ? new Date(startDate).getTime() : null;
    if (endTimestamp && Date.now() >= endTimestamp) return "completed";
    if (!startTimestamp) return "upcoming";
    return Date.now() >= startTimestamp ? "live" : "upcoming";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchEvent();
  }, [id, type]);

  useEffect(() => {
    setEventMedia([]);
    setMediaError(null);
  }, [id, type]);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!event?.id) return;
      try {
        setMediaLoading(true);
        setMediaError(null);
        const idKey = String(event.id);

        const loadByEventKey = async (eventKey) => {
          const response = await mediaAPI.getAll({
            category: "events",
            visibility: "public",
            event: eventKey,
            limit: 50,
          });
          return response.media || [];
        };

        let mediaItems = await loadByEventKey(idKey);
        // Legacy rows saved with tournament name instead of id
        if (mediaItems.length === 0 && event.title) {
          mediaItems = await loadByEventKey(event.title);
        }

        const seen = new Set();
        mediaItems = mediaItems.filter((item) => {
          if (!item?._id || seen.has(String(item._id))) return false;
          seen.add(String(item._id));
          return true;
        });

        setEventMedia(mediaItems);
      } catch (error) {
        console.error("Error fetching event media:", error);
        setMediaError("Unable to load event media.");
        setEventMedia([]);
      } finally {
        setMediaLoading(false);
      }
    };

    fetchMedia();
  }, [event]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      let eventData = null;

      if (type === "tournament") {
        const response = await tournamentAPI.getById(id);
        const tournament = response.tournament || response;

        const totalRegistrations =
          (tournament.registeredTeams?.length || 0) +
          (tournament.registeredPlayers?.length || 0);

        // Calculate displayStatus and registrationOpen if not provided
        const now = new Date().getTime();
        const startDate = tournament.startDate
          ? new Date(tournament.startDate).getTime()
          : null;
        const endDate = tournament.endDate
          ? new Date(tournament.endDate).getTime()
          : null;
        const registrationDeadline = tournament.registrationDeadline
          ? new Date(tournament.registrationDeadline).getTime()
          : null;
        const displayStatus = getEventStatusFromDates(
          tournament.startDate,
          tournament.endDate,
        );
        let registrationOpen = tournament.registrationOpen || false;

        if (registrationDeadline && now >= registrationDeadline) {
          registrationOpen = false;
        }
        if (endDate && now >= endDate) {
          registrationOpen = false;
        }
        if (startDate && now >= startDate) {
          registrationOpen = false;
        }

        eventData = {
          id: tournament._id,
          title: tournament.name,
          date: tournament.startDate,
          endDate: tournament.endDate,
          registrationDeadline: tournament.registrationDeadline,
          location: tournament.location || tournament.venue || "TBA",
          type: "tournament",
          status: displayStatus,
          registrationOpen: registrationOpen,
          participants: totalRegistrations,
          maxParticipants: tournament.maxTeams || 0,
          price: tournament.entryFee || 0,
          minTeamMembers: tournament.minTeamMembers || 2,
          maxTeamMembers: tournament.maxTeamMembers || 10,
          tournamentType: tournament.tournamentType || "team",
          description: tournament.description || "",
          image:
            absoluteMediaSrc(tournament.image) ||
            "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
          rules: tournament.rules || "",
          prizePool: tournament.prizePool || 0,
          format: tournament.format || "knockout",
          registeredTeams: tournament.registeredTeams || [],
          registeredPlayers: tournament.registeredPlayers || [],
        };
      } else if (type === "match") {
        const response = await matchAPI.getById(id);
        const match = response.match || response;

        const team1Name =
          match.team1?.team?.name || match.team1?.player?.username || "TBD";
        const team2Name =
          match.team2?.team?.name || match.team2?.player?.username || "TBD";

        eventData = {
          id: match._id,
          title: `${team1Name} vs ${team2Name}`,
          date: match.scheduledDate,
          location: match.location || match.venue || "TBA",
          type: "match",
          status:
            getEventStatusFromDates(match.scheduledDate, match.endDate || null),
          registrationOpen: false,
          participants: 2,
          maxParticipants: 2,
          price: 0,
          description: match.notes || "",
          image:
            absoluteMediaSrc(match.image) ||
            "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
          tournament: match.tournament,
        };
      }

      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      showError("Failed to load event. Please try again.");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (status === "completed") return "PAST";
    return status === "live" ? "LIVE" : "UPCOMING";
  };

  const statusColors = {
    upcoming: "bg-orange-500 text-white",
    live: "bg-red-500 text-white",
    completed: "bg-primary-500 text-white",
  };

  const progress =
    event?.maxParticipants > 0
      ? (event?.participants / event?.maxParticipants) * 100
      : 0;

  const isRegistrationDeadlinePassed = event?.registrationDeadline
    ? new Date(event.registrationDeadline).getTime() < new Date().getTime()
    : false;

  const showRegisterButton =
    event?.registrationOpen && !isRegistrationDeadlinePassed;

  const isAlreadyRegistered = useMemo(() => {
    if (!event || !user || event.type !== "tournament") return false;

    const userId = user._id || user.id;
    if (!userId) return false;

    const normalizeId = (value) => {
      if (!value) return null;
      if (typeof value === "string") return value;
      if (typeof value === "object") return value._id || value.id || null;
      return null;
    };

    // Check individual registrations
    if (Array.isArray(event.registeredPlayers)) {
      const isPlayerRegistered = event.registeredPlayers.some((reg) => {
        const playerId = normalizeId(reg.player || reg.playerId || reg);
        return playerId && playerId.toString() === userId.toString();
      });
      if (isPlayerRegistered) return true;
    }

    // Check team registrations (team leader or team member)
    if (Array.isArray(event.registeredTeams)) {
      const isTeamRegistered = event.registeredTeams.some((reg) => {
        const team = reg.team || reg;
        if (!team) return false;

        const leaderId = normalizeId(team.leader);
        if (leaderId && leaderId.toString() === userId.toString()) {
          return true;
        }

        if (Array.isArray(team.members)) {
          return team.members.some((member) => {
            const memberId = normalizeId(member);
            return memberId && memberId.toString() === userId.toString();
          });
        }

        return false;
      });

      if (isTeamRegistered) return true;
    }

    return false;
  }, [event, user]);

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      showError("Please register or login first to continue.");
      navigate(`/login?redirect=/events/${type}/${id}`);
      return;
    }

    setSelectedEvent(event);
  };

  const openEventMedia = (item) => {
    setSelectedMedia({
      ...item,
      url: absoluteMediaSrc(item.url) || item.url,
      thumbnail: item.thumbnail
        ? absoluteMediaSrc(item.thumbnail) || item.thumbnail
        : item.thumbnail,
    });
  };

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

  if (!event) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 pb-16">
        <EmptyState
          variant="events"
          title="Event not found"
          description="This event may have been removed or the link is no longer valid."
          actionLabel="Browse events"
          actionTo="/events"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        {/* Modern Back Button */}
        <motion.button
          onClick={() => navigate("/events")}
          className="mb-8 flex items-center gap-3 px-5 py-3 rounded-xl bg-white/80 backdrop-blur-md border border-primary-200/50 text-primary-700 hover:text-secondary-600 hover:bg-white hover:border-secondary-300 hover:shadow-lg transition-all duration-300 group shadow-sm"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <IoArrowBack className="w-5 h-5 group-hover:text-secondary-600 transition-colors" />
          <span className="font-semibold">Back to Events</span>
        </motion.button>

        {/* Hero Section with Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8 lg:mb-12"
        >
          <div className="relative h-[380px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden shadow-2xl group">
            {/* Image with parallax effect */}
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.7 }}
            >
              <img
                src={absoluteMediaSrc(event.image) || event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {/* Dark gradient overlay (deep blue/purple to dark) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/75 to-slate-950/98" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-900/50" />

            {/* Status badges - top left: edition status */}
            <div className="absolute top-5 left-5 flex gap-3 flex-wrap z-10">
              {event.status === "completed" && (
                <motion.span
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-800/90 text-white border border-white/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Past Edition
                </motion.span>
              )}
              {event.registrationOpen && (
                <motion.span
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-700/80 text-white border border-white/10 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  Registration Open
                </motion.span>
              )}
              {!event.registrationOpen && event.status !== "completed" && (
                <motion.span
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[event.status] || statusColors.upcoming} border border-white/10`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {formatStatus(event.status)}
                </motion.span>
              )}
            </div>

            {/* Centered title and subtitle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl leading-tight tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {event.title}
              </motion.h1>
              <motion.p
                className="text-white/90 text-sm sm:text-base lg:text-lg uppercase tracking-[0.2em] mt-2 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                {event.endDate
                  ? new Date(event.endDate).toLocaleDateString("en-US", {
                      year: "numeric",
                    })
                  : new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                    })}
              </motion.p>
              {event.description && (
                <motion.p
                  className="text-white/80 text-sm max-w-2xl mt-4 line-clamp-2 drop-shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {event.description}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Event Media — only when loading, error, or there is media */}
        {mediaLoading || mediaError || eventMedia.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-primary-200 mb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <IoInformationCircle className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-primary-950">
                    Event photos & videos
                  </h3>
                </div>
                {mediaLoading && (
                  <span className="text-xs text-primary-500">
                    Loading media...
                  </span>
                )}
              </div>

              {mediaError && !mediaLoading && (
                <p className="text-sm text-primary-500">{mediaError}</p>
              )}

              {!mediaLoading && eventMedia.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {eventMedia.map((item) => {
                    const isVideo = item.type === "video";
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => openEventMedia(item)}
                        className="relative group rounded-xl overflow-hidden border border-primary-200/70 bg-primary-900/5"
                      >
                        <EventMediaTileCover item={item} />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                          <span className="font-medium truncate">
                            {item.category?.replace(/-/g, " ") || "Event"}
                          </span>
                          {isVideo && (
                            <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] uppercase tracking-wide">
                              Video
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left Column - Main Details */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Key info cards - colored icons per reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <IoCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-1 font-semibold">
                  Start date
                </p>
                <p className="text-xl font-bold text-primary-950">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-primary-500 mt-0.5">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric",
                  })}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <IoLocation className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-1 font-semibold">
                  Location
                </p>
                <p className="text-lg font-bold text-primary-950 line-clamp-1">
                  {event.location.includes(",")
                    ? event.location.split(",")[0].trim()
                    : event.location}
                </p>
                <p className="text-sm text-primary-500 mt-0.5 line-clamp-1">
                  {event.location.includes(",")
                    ? event.location.split(",").slice(1).join(",").trim()
                    : "—"}
                </p>
              </motion.div>

              {event.type === "tournament" && event.status !== "completed" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <IoPeople className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-1 font-semibold">
                      Participants
                    </p>
                    <p className="text-xl font-bold text-primary-950">
                      {event.participants}/{event.maxParticipants}
                    </p>
                    <p className="text-sm text-primary-500 mt-0.5">Confirmed</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-2xl p-5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <IoCash className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-1 font-semibold">
                      Entry fee
                    </p>
                    <p className="text-xl font-bold text-primary-950">
                      {event.price > 0 ? `$${event.price.toFixed(2)}` : "Free"}
                    </p>
                    <p className="text-sm text-primary-500 mt-0.5">
                      {event.tournamentType === "team"
                        ? "Per team"
                        : "Per player"}
                    </p>
                  </motion.div>
                </>
              )}
            </div>

            {/* Event Information card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-primary-200"
            >
              <h2 className="text-xl font-bold text-primary-950 mb-6 flex items-center gap-3">
                <span className="p-2 bg-primary-100 rounded-full">
                  <IoInformationCircle className="w-5 h-5 text-primary-600" />
                </span>
                Event information
              </h2>

              <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-4 p-5 bg-primary-50/50 rounded-xl border border-primary-200/50">
                  <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                    <IoCalendar className="w-6 h-6 text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-2 font-semibold">
                      Event schedule
                    </p>
                    <p className="text-lg font-bold text-primary-950 mb-1">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {event.endDate && (
                      <p className="text-sm text-primary-600">
                        Ends:{" "}
                        {new Date(event.endDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 p-5 bg-primary-50/50 rounded-xl border border-primary-200/50">
                  <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                    <IoLocation className="w-6 h-6 text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-2 font-semibold">
                      Venue
                    </p>
                    <p className="text-lg font-bold text-primary-950">
                      {event.location.includes(",")
                        ? event.location.split(",")[0].trim()
                        : event.location}
                    </p>
                    {event.location.includes(",") && (
                      <p className="text-sm text-primary-600 mt-0.5">
                        {event.location.split(",").slice(1).join(",").trim()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Registration Deadline */}
                {event.registrationDeadline && (
                  <div className="flex items-start gap-4 p-5 bg-primary-50/50 rounded-xl border border-primary-200/50">
                    <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                      <IoTime className="w-6 h-6 text-primary-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-2 font-semibold">
                        Registration deadline
                      </p>
                      <p className="text-lg font-bold text-primary-950">
                        {new Date(
                          event.registrationDeadline,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-primary-500 mt-1">
                        Registration closes 24 hours prior
                      </p>
                    </div>
                  </div>
                )}

                {/* Tournament-specific info */}
                {event.type === "tournament" && (
                  <>
                    {event.status !== "completed" && (
                      <div className="p-5 bg-primary-50/50 rounded-2xl border border-primary-200/50">
                        <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-2 font-semibold">
                          Registration progress
                        </p>
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <span className="text-base font-bold text-primary-950">
                            {event.participants}/{event.maxParticipants} Registered
                          </span>
                          <span className="text-base font-bold text-green-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-primary-200/60 rounded-full h-2.5 overflow-hidden border border-green-200">
                          <motion.div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(progress, 2)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Prize Pool - prominent golden box */}
                    {event.prizePool > 0 && (
                      <div className="p-6 rounded-2xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50/80 to-white shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <IoTrophy className="w-9 h-9 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-primary-500 uppercase tracking-widest mb-1 font-semibold">
                              Total prize pool
                            </p>
                            <p className="text-3xl font-black text-amber-700">
                              $
                              {Number(event.prizePool).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Event tags - pill style with icons */}
                    <div className="flex flex-wrap gap-2">
                      {event.tournamentType && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-primary-200 bg-white text-primary-800 capitalize">
                          <IoFlag className="w-4 h-4 text-red-500" />
                          {event.tournamentType === "both"
                            ? "Individual / Team"
                            : event.tournamentType}
                        </span>
                      )}
                      {event.format && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-primary-200 bg-white text-primary-800 capitalize">
                          <IoTrophy className="w-4 h-4 text-amber-500" />
                          {event.format.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Rules Section */}
            {event.rules && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-primary-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <IoShieldCheckmark className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-primary-950">
                    Rules & regulations
                  </h3>
                </div>
                <div className="text-primary-700 whitespace-pre-wrap leading-relaxed bg-primary-50/50 p-6 rounded-xl border border-primary-200/50 text-sm">
                  {event.rules}
                </div>
              </motion.div>
            )}

          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6 lg:col-span-1"
          >
            {/* Countdown Timer */}
            {event.status === "upcoming" && event.date && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-primary-200"
              >
                <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold mb-4">
                  Event starts in
                </p>
                <CountdownTimer
                  targetDate={event.date}
                  registrationDeadline={event.registrationDeadline}
                />
              </motion.div>
            )}

            {/* Quick Facts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-primary-200"
            >
              <h4 className="text-lg font-bold text-primary-950 mb-4">
                Quick facts
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="p-1.5 bg-amber-50 rounded-lg flex-shrink-0">
                    <IoStar className="w-5 h-5 text-amber-600" />
                  </span>
                  <div>
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest font-semibold">
                      Event type
                    </p>
                    <p className="text-sm font-medium text-primary-900 capitalize">
                      {event.type === "tournament" && event.tournamentType
                        ? `${event.tournamentType === "both" ? "Team / Individual" : event.tournamentType} Tournament`
                        : event.type}
                    </p>
                  </div>
                </div>
                {event.type === "tournament" && (
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
                      <IoShieldCheckmark className="w-5 h-5 text-blue-600" />
                    </span>
                    <div>
                      <p className="text-[11px] text-primary-500 uppercase tracking-widest font-semibold">
                        Format
                      </p>
                      <p className="text-sm font-medium text-primary-900 capitalize">
                        Double elimination
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="p-1.5 bg-green-50 rounded-lg flex-shrink-0">
                    <IoGlobe className="w-5 h-5 text-green-600" />
                  </span>
                  <div>
                    <p className="text-[11px] text-primary-500 uppercase tracking-widest font-semibold">
                      Region
                    </p>
                    <p className="text-sm font-medium text-primary-900">
                      International / Global
                    </p>
                  </div>
                </div>
                {event.type === "tournament" &&
                  event.tournamentType !== "individual" &&
                  event.minTeamMembers && (
                    <div className="flex items-start gap-3">
                      <span className="p-1.5 bg-primary-100 rounded-lg flex-shrink-0">
                        <IoPeople className="w-5 h-5 text-primary-600" />
                      </span>
                      <div>
                        <p className="text-[11px] text-primary-500 uppercase tracking-widest font-semibold">
                          Team size
                        </p>
                        <p className="text-sm font-medium text-primary-900">
                          {event.minTeamMembers}–{event.maxTeamMembers} members
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>

            {/* CTA - Ready to compete */}
            {event.type === "tournament" && event.status !== "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-primary-900 rounded-2xl p-6 text-white"
              >
                <h3 className="text-xl font-bold mb-2">Ready to compete?</h3>
                <p className="text-white/80 text-sm mb-6">
                  Secure your spot in the most prestigious tournament of the
                  season.
                </p>
                {isAlreadyRegistered ? (
                  <div className="w-full px-6 py-4 border border-green-500/60 bg-green-500/10 text-green-300 font-semibold text-sm rounded-xl flex items-center justify-center gap-2">
                    <IoCheckmarkCircle className="w-5 h-5" />
                    Registered
                  </div>
                ) : showRegisterButton ? (
                  <motion.button
                    onClick={handleRegisterClick}
                    className="w-full px-6 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-secondary-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IoCheckmarkCircle className="w-5 h-5" />
                    Register now
                  </motion.button>
                ) : (
                  <div className="w-full px-6 py-4 border border-primary-700/50 bg-primary-800/60 text-primary-100 font-semibold text-sm rounded-xl text-center">
                    Registration closed
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <RegistrationModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>

      {/* Event Media Lightbox */}
      {selectedMedia && (
        <LightboxViewer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
};

export default EventDetails;
