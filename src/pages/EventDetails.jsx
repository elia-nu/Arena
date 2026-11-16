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
  IoFootball,
  IoFootballOutline,
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
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

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

        // Populate tournament matches inside the event
        let matchesList = tournament.matches || [];
        if (!matchesList || matchesList.length === 0) {
          try {
            setMatchesLoading(true);
            const mRes = await matchAPI.getAll({
              tournament: tournament._id,
              limit: 50,
            });
            matchesList = mRes.matches || [];
          } catch (mErr) {
            console.error("Failed to load tournament matches:", mErr);
          } finally {
            setMatchesLoading(false);
          }
        }
        setTournamentMatches(matchesList);
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
      <div className="min-h-screen bg-[#07080a] pt-32 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-secondary-500/20 border-t-secondary-500 rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#07080a] pt-32 pb-16">
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
    <div className="min-h-screen bg-[#07080a] text-white pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/events")}
            className="inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            <IoArrowBack className="w-4 h-4" />
            <span>All tournaments</span>
          </button>
        </div>

        {/* Hero Banner */}
        <div className="relative mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#12151d]">
          <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]">
            <img
              src={absoluteMediaSrc(event.image) || event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1015] via-[#0e1015]/60 to-transparent" />

            {/* Badges - Top */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              {event.status === "completed" ? (
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/70 backdrop-blur-sm border border-white/10 text-white/60">
                  Completed
                </span>
              ) : event.status === "live" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-950/80 backdrop-blur-sm border border-red-500/30 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Live tournament
                </span>
              ) : event.registrationOpen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Registration open
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/70 backdrop-blur-sm border border-white/10 text-white/70">
                  Upcoming
                </span>
              )}
            </div>

            {/* Title & Location - Bottom */}
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-2">
                {event.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
                {event.description || `${event.location} • Street Soccer Showcase`}
              </p>
            </div>
          </div>
        </div>

        {/* Event Media Highlights — only when loading, error, or media exists */}
        {mediaLoading || mediaError || eventMedia.length > 0 ? (
          <div className="bg-[#12151d] rounded-2xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                Event highlights &amp; media
              </h2>
              {mediaLoading && (
                <span className="text-xs text-white/50">Loading media...</span>
              )}
            </div>

            {mediaError && !mediaLoading && (
              <p className="text-xs text-red-400">{mediaError}</p>
            )}

            {!mediaLoading && eventMedia.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {eventMedia.map((item) => {
                  const isVideo = item.type === "video";
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => openEventMedia(item)}
                      className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 transition-colors hover:border-white/20"
                    >
                      <EventMediaTileCover item={item} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                        <span className="font-medium truncate text-[11px]">
                          {item.category?.replace(/-/g, " ") || "Event"}
                        </span>
                        {isVideo && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary-500 text-white text-[10px] font-medium">
                            Video
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#12151d] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] text-white/50 font-medium">Start date</span>
                <p className="text-base font-semibold text-white mt-2">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <span className="text-[11px] text-white/40 mt-0.5">
                  {new Date(event.date).toLocaleDateString("en-US", { year: "numeric" })}
                </span>
              </div>

              <div className="bg-[#12151d] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] text-white/50 font-medium">Venue</span>
                <p className="text-base font-semibold text-white mt-2 line-clamp-1">
                  {event.location.includes(",")
                    ? event.location.split(",")[0].trim()
                    : event.location}
                </p>
                <span className="text-[11px] text-white/40 mt-0.5 line-clamp-1">
                  {event.location.includes(",")
                    ? event.location.split(",").slice(1).join(",").trim()
                    : "Ethiopia"}
                </span>
              </div>

              <div className="bg-[#12151d] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] text-white/50 font-medium">Roster slots</span>
                <p className="text-base font-semibold text-white mt-2 font-mono tabular-nums">
                  {event.participants} / {event.maxParticipants}
                </p>
                <span className="text-[11px] text-secondary-400 font-medium mt-0.5">
                  {Math.round(progress)}% registered
                </span>
              </div>

              <div className="bg-[#12151d] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[11px] text-white/50 font-medium">Entry fee</span>
                <p className="text-base font-semibold text-white mt-2 font-mono tabular-nums">
                  {event.price > 0 ? `$${event.price}` : "Free"}
                </p>
                <span className="text-[11px] text-white/40 mt-0.5">
                  {event.tournamentType === "team" ? "Per squad" : "Per player"}
                </span>
              </div>
            </div>

            {/* Event Intel & Schedule */}
            <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">
                Tournament schedule &amp; venue
              </h2>

              <div className="space-y-2.5">
                <div className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-white/50 text-[11px] block mb-0.5">Dates</span>
                    <span className="font-medium text-white">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {event.endDate && (
                      <span className="text-white/50 block mt-0.5 text-[11px]">
                        Concludes: {new Date(event.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-white/50 text-[11px] block mb-0.5">Pitch location</span>
                    <span className="font-medium text-white">{event.location}</span>
                  </div>
                </div>

                {event.registrationDeadline && (
                  <div className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                    <div>
                      <span className="text-white/50 text-[11px] block mb-0.5">Registration deadline</span>
                      <span className="font-medium text-white">
                        {new Date(event.registrationDeadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Prize pool summary */}
                {event.prizePool > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-white/50 font-medium uppercase tracking-wider block">
                        Prize pool
                      </span>
                      <span className="text-xl font-bold text-white font-mono tabular-nums">
                        ${Number(event.prizePool).toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {event.format && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 border border-white/10 text-white/70 capitalize">
                          {event.format.replace("-", " ")}
                        </span>
                      )}
                      {event.tournamentType && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 border border-white/10 text-white/70 capitalize">
                          {event.tournamentType}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tournament Matches & Fixtures */}
            {event.type === "tournament" && (
              <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Matches &amp; fixtures
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      Pairings, scheduled times, and match outcomes
                    </p>
                  </div>
                  {tournamentMatches.length > 0 && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-white/70">
                      {tournamentMatches.length} fixtures
                    </span>
                  )}
                </div>

                {matchesLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : tournamentMatches.length === 0 ? (
                  <div className="p-8 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <IoFootballOutline className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-xs font-medium text-white/70">
                      Fixtures announcement soon
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 max-w-sm mx-auto">
                      Match pairings will be published once squad registration concludes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tournamentMatches.map((m, idx) => {
                      const team1Name =
                        m.team1?.team?.name || m.team1?.player?.username || "TBD";
                      const team2Name =
                        m.team2?.team?.name || m.team2?.player?.username || "TBD";
                      const isLive = m.status === "live";
                      const isCompleted = m.status === "completed";
                      const team1Score = m.team1?.score ?? m.result?.score?.team1Score ?? 0;
                      const team2Score = m.team2?.score ?? m.result?.score?.team2Score ?? 0;

                      return (
                        <div
                          key={m._id || idx}
                          className={`p-4 rounded-xl border transition-colors ${
                            isLive
                              ? "bg-red-950/20 border-red-500/30"
                              : isCompleted
                              ? "bg-white/[0.02] border-white/10"
                              : "bg-white/[0.02] border-white/5"
                          }`}
                        >
                          {/* Round & Status Bar */}
                          <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-white/5">
                            <span className="text-[11px] font-medium text-white/60">
                              {m.round || `Match ${m.matchNumber || idx + 1}`}
                              {m.matchNumber ? ` • #${m.matchNumber}` : ""}
                            </span>
                            <div className="flex items-center gap-2">
                              {m.scheduledTime && (
                                <span className="text-white/50 text-[11px] font-mono">
                                  {m.scheduledTime}
                                </span>
                              )}
                              {isLive ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Live
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2 py-0.5 rounded bg-white/5 text-white/50 text-[10px]">
                                  Final
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px]">
                                  Scheduled
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Teams & Score */}
                          <div className="grid grid-cols-5 items-center gap-2">
                            <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 shrink-0">
                                {team1Name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className={`text-xs font-medium truncate ${isCompleted && team1Score > team2Score ? "text-white font-semibold" : "text-white/80"}`}>
                                {team1Name}
                              </span>
                            </div>

                            <div className="col-span-1 text-center font-mono text-xs tabular-nums text-white/70">
                              {isLive || isCompleted ? (
                                <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10">
                                  {team1Score} - {team2Score}
                                </span>
                              ) : (
                                <span className="text-white/30 text-[11px]">vs</span>
                              )}
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-2.5 min-w-0 text-right">
                              <span className={`text-xs font-medium truncate ${isCompleted && team2Score > team1Score ? "text-white font-semibold" : "text-white/80"}`}>
                                {team2Name}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 shrink-0">
                                {team2Name.slice(0, 2).toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          {(m.venue || m.location) && (
                            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                              <span className="truncate">{m.venue || m.location}</span>
                              <span className="font-mono">
                                {new Date(m.scheduledDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Confirmed Registered Squads */}
            {event.type === "tournament" &&
              event.registeredTeams &&
              event.registeredTeams.length > 0 && (
                <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-white">
                      Confirmed squads ({event.registeredTeams.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {event.registeredTeams.map((reg, idx) => {
                      const team = reg.team || reg;
                      const teamName = team?.name || `Squad ${idx + 1}`;
                      return (
                        <div
                          key={team?._id || idx}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 shrink-0">
                            {teamName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-white/80 truncate">
                            {teamName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Rules Section */}
            {event.rules && (
              <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-3">
                  Rules &amp; guidelines
                </h2>
                <div className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                  {event.rules}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Countdown Timer */}
            {event.status === "upcoming" && event.date && (
              <div className="bg-[#12151d] border border-white/10 rounded-2xl p-5">
                <span className="text-xs text-white/50 block mb-2 font-medium">
                  Kickoff countdown
                </span>
                <CountdownTimer
                  targetDate={event.date}
                  registrationDeadline={event.registrationDeadline}
                  theme="dark"
                />
              </div>
            )}

            {/* Tournament Details */}
            <div className="bg-[#12151d] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white mb-3">
                Tournament details
              </h3>

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/50">Division</span>
                <span className="text-white font-medium capitalize">
                  {event.type === "tournament" && event.tournamentType
                    ? `${event.tournamentType === "both" ? "Team / Solo" : event.tournamentType}`
                    : event.type}
                </span>
              </div>

              {event.format && (
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-white/50">Format</span>
                  <span className="text-white font-medium capitalize">
                    {event.format.replace("-", " ")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/50">Region</span>
                <span className="text-white font-medium">Ethiopia</span>
              </div>

              {event.minTeamMembers && (
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-white/50">Squad size</span>
                  <span className="text-white font-mono text-[11px]">
                    {event.minTeamMembers}–{event.maxTeamMembers} players
                  </span>
                </div>
              )}
            </div>

            {/* Registration Action Card */}
            {event.type === "tournament" && event.status !== "completed" && (
              <div className="rounded-2xl p-5 bg-[#12151d] border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Squad entry
                </h3>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">
                  Register your squad to compete in this event.
                </p>

                {isAlreadyRegistered ? (
                  <div className="w-full py-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <IoCheckmarkCircle className="w-4 h-4" />
                    Entry confirmed
                  </div>
                ) : showRegisterButton ? (
                  <button
                    onClick={handleRegisterClick}
                    className="w-full py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <IoCheckmarkCircle className="w-4 h-4" />
                    Register squad
                  </button>
                ) : (
                  <div className="w-full py-2.5 border border-white/10 bg-white/5 text-white/40 text-xs rounded-xl text-center">
                    Registration closed
                  </div>
                )}
              </div>
            )}
          </div>
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
