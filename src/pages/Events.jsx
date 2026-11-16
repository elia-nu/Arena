import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoArrowForward, IoArrowDown } from "react-icons/io5";
import EventCard from "../components/events/EventCard";
import EventFilters from "../components/events/EventFilters";
import RegistrationModal from "../components/events/RegistrationModal";
import { tournamentAPI, matchAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";
import { usePageSEO } from "../hooks/usePageSEO";

const Events = () => {
  usePageSEO({
    title: "Tournaments & Events",
    description:
      "Explore upcoming street soccer tournaments, matchdays, and youth clinics across Addis Ababa and Hawassa. Register your team today.",
    path: "/events",
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const getEventStatusFromDates = (startDate, endDate) => {
    const endTimestamp = endDate ? new Date(endDate).getTime() : null;
    const startTimestamp = startDate ? new Date(startDate).getTime() : null;
    if (endTimestamp && Date.now() >= endTimestamp) return "completed";
    if (!startTimestamp) return "upcoming";
    return Date.now() >= startTimestamp ? "live" : "upcoming";
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params for tournaments
        const tournamentParams = { limit: 50 };
        if (statusFilter !== "all") {
          tournamentParams.displayStatus = statusFilter;
        }

        // Fetch tournaments and matches in parallel
        const [tournamentsData, matchesData] = await Promise.all([
          tournamentAPI.getAll(tournamentParams),
          matchAPI.getAll({ limit: 50 }),
        ]);

        const tournaments = tournamentsData.tournaments || [];
        const matches = matchesData.matches || [];

        // Map tournaments to event format - use displayStatus from backend
        const tournamentEvents = tournaments
          .filter(
            (tournament) =>
              tournament.status !== "cancelled"
          )
          .map((tournament) => {
            const totalRegistrations =
              (tournament.registeredTeams?.length || 0) +
              (tournament.registeredPlayers?.length || 0);

            return {
              id: tournament._id,
              title: tournament.name,
              // Event date is the tournament start date
              date: tournament.startDate,
              // Use the tournament start date for the countdown timer so it always
              // shows time remaining until the event actually begins.
              countdownDate: tournament.startDate,
              endDate: tournament.endDate,
              registrationDeadline: tournament.registrationDeadline,
              location: tournament.location || tournament.venue || "TBA",
              type: "tournament",
              status: getEventStatusFromDates(
                tournament.startDate,
                tournament.endDate,
              ),
              registrationOpen: tournament.registrationOpen || false, // Use registrationOpen from backend
              participants: totalRegistrations,
              maxParticipants: tournament.maxTeams || 0,
              price: tournament.entryFee || 0,
              minTeamMembers: tournament.minTeamMembers || 2,
              maxTeamMembers: tournament.maxTeamMembers || 10,
              tournamentType: tournament.tournamentType || "team",
              registeredPlayers: tournament.registeredPlayers || [],
              registeredTeams: tournament.registeredTeams || [],
              image:
                absoluteMediaSrc(tournament.image) ||
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
              description:
                tournament.description ||
                "Join this exciting tournament and compete for glory.",
            };
          });

        // Map matches to event format
        const matchEvents = matches
          .filter(
            (match) =>
              match.status !== "cancelled" &&
              // Hide individual (player vs player) matches from the public events list.
              // Only show matches where both sides are teams.
              match.team1?.team &&
              match.team2?.team
          )
          .map((match) => {
            // Create match title
            const team1Name =
              match.team1?.team?.name || match.team1?.player?.username || "TBD";
            const team2Name =
              match.team2?.team?.name || match.team2?.player?.username || "TBD";
            const matchTitle = `${team1Name} vs ${team2Name}`;

            return {
              id: match._id,
              title: matchTitle,
              date: match.scheduledDate,
              countdownDate: match.scheduledDate,
              location: match.location || match.venue || "TBA",
              type: "match",
              status: getEventStatusFromDates(
                match.scheduledDate,
                match.endDate || null,
              ),
              registrationOpen: false, // Matches typically don't have registration
              participants: 2, // Two teams/players
              maxParticipants: 2,
              price: 0,
              image:
                absoluteMediaSrc(match.image) ||
                "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
              description:
                match.notes ||
                `Match scheduled for ${new Date(
                  match.scheduledDate
                ).toLocaleDateString()}`,
            };
          });

        // Combine and sort by date
        const allEvents = [...tournamentEvents, ...matchEvents].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setError(error.message || "Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [statusFilter]);

  const filteredEvents = events.filter((event) => {
    // Filter by type
    if (filter !== "all") {
      if (filter === "team_tournament") {
        if (event.type !== "tournament") return false;
        if (event.tournamentType !== "team" && event.tournamentType !== "both") return false;
      }
      if (filter === "match" && event.type !== "match") return false;
    }

    // Filter by status (statusFilter is handled by backend for tournaments, but we filter matches here)
    if (statusFilter !== "all") {
      if (statusFilter === "upcoming" && event.status !== "upcoming") return false;
      if (statusFilter === "live" && event.status !== "live") return false;
    }

    return true;
  });

  const upcomingEvents = filteredEvents.filter(
    (event) => event.status !== "completed"
  );

  const pastEvents = filteredEvents.filter(
    (event) => event.status === "completed"
  );

  const handleRegisterClick = (event) => {
    if (!isAuthenticated) {
      showError("Please register or login first to continue.");
      navigate(`/login?redirect=/events/${event.type}/${event.id}`);
      return;
    }

    setSelectedEvent(event);
  };

  const ebcHeroWebp =
    "https://ebc.et/admin/uploads/2025/10/29/403e17fa-b697-42b5-b1ff-911b9833369b.webp";
  const ebcHeroFallback = "/ebc-stadium-hero.webp";

  return (
    <div className="min-h-screen bg-[#07080a] text-white overflow-x-hidden selection:bg-secondary-500 selection:text-white">
      {/* ─── FULL-BLEED HERO BANNER (MATCHING COMMUNITY STADIUM DESIGN) ─── */}
      <section className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[740px] flex items-center pt-32 sm:pt-40 pb-20 md:pb-28 overflow-hidden bg-neutral-950">
        {/* Full-bleed Background Image */}
        <div className="absolute inset-0">
          <img
            src={ebcHeroWebp}
            onError={(e) => {
              e.currentTarget.src = ebcHeroFallback;
            }}
            alt="The Arena Tournaments & Street Soccer Events"
            className="w-full h-full object-cover object-center scale-102"
          />
          {/* Cinematic Vignette Overlay - dark on left for text contrast, translucent on right for players */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-black/40 to-black/25" />
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
              <span>Arena Tournament Calendar • Addis Ababa &amp; Hawassa</span>
            </motion.div>

            {/* Massive Bold Heading */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.98] mb-6 uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              ARENA <span className="text-secondary-500">EVENTS</span>
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
                href="#events-list"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg hover:shadow-secondary-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                EXPLORE FIXTURES <IoArrowDown className="text-sm" />
              </a>
              <Link
                to="/about-us"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-widest rounded-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                OUR STORY <IoArrowForward className="text-sm" />
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

      {/* ─── EVENTS LIST & TOURNAMENT CALENDAR ─── */}
      <div id="events-list" className="relative scroll-mt-20">
        {/* Background Stadium Grid & Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="events-page-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.2" fill="rgba(254, 87, 35, 0.3)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#events-page-grid)" />
          </svg>

          {/* Ambient Orange Stadium Blooms */}
          <div
            className="absolute top-10 -right-32 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none opacity-20"
            style={{ background: "radial-gradient(circle, #fe5723 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/2 -left-40 w-[600px] h-[600px] rounded-full blur-[200px] pointer-events-none opacity-15"
            style={{ background: "radial-gradient(circle, #ff8b42 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 relative z-10">
          {/* Tactical Sub-Heading */}
          <motion.div
            className="text-center mb-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 backdrop-blur-md mb-3 shadow-[0_0_20px_rgba(254,87,35,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500 shadow-[0_0_8px_#fe5723]" />
              </span>
              <span className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase">
                ACTIVE SHOWDOWNS &amp; BRACKETS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              SELECT YOUR <span className="text-secondary-500">TOURNAMENT</span>
            </h2>
          </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
          <EventFilters 
            filter={filter} 
            onFilterChange={setFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="mb-6 flex items-center justify-between text-xs sm:text-sm text-white/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p>
            <span className="text-secondary-400 font-bold">
              {filteredEvents.length}
            </span>{" "}
            {filteredEvents.length === 1 ? "event" : "events"} found
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-secondary-400 hover:text-secondary-300 uppercase tracking-wider font-bold transition-colors duration-200"
            >
              Clear filters
            </button>
          )}
        </motion.div>

        {/* Enhanced Events Grid */}
        {loading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <motion.div
                key={index}
                className="bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm h-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + index * 0.1,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                <div className="h-64 md:h-72 bg-primary-100 animate-pulse" />
                <div className="p-6 md:p-8">
                  <div className="h-6 bg-primary-200 rounded mb-3 animate-pulse" />
                  <div className="h-4 bg-primary-200 rounded mb-6 animate-pulse" />
                  <div className="h-4 bg-primary-200 rounded mb-6 animate-pulse" />
                  <div className="h-10 bg-primary-200 rounded animate-pulse" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : error ? (
          <EmptyState
            variant="error"
            title="Unable to load events"
            description={error}
            actionLabel="Back to home"
            actionTo="/"
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            variant="events"
            title="No events found"
            description="Try adjusting your filters, or check back soon for new tournaments and matches."
            actionLabel="Clear filters"
            onAction={() => {
              setFilter("all");
              setStatusFilter("all");
            }}
          />
        ) : (
          <div className="space-y-12">
            {upcomingEvents.length === 0 && pastEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-secondary-500/10 border border-secondary-500/30 text-center max-w-2xl mx-auto backdrop-blur-md"
              >
                <p className="text-secondary-400 font-black uppercase tracking-wider mb-1 text-sm">
                  Championship Season Update
                </p>
                <p className="text-sm text-white/70">
                  There are no open upcoming tournaments right now. Explore our past completed tournaments and champion results below!
                </p>
              </motion.div>
            )}

            {upcomingEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-500 animate-pulse" />
                  Upcoming Tournaments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.7 + index * 0.1,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    >
                      <EventCard
                        event={event}
                        onRegister={() => handleRegisterClick(event)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {pastEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="mb-6">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                    Past{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400">
                      Showdowns & Results
                    </span>
                  </h2>
                  <p className="text-sm md:text-base text-white/50 font-light mt-1">
                    Relive previous tournaments, champion rosters, and competition archives.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
                  {pastEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 1 + index * 0.1,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    >
                      <EventCard
                        event={event}
                        onRegister={() => handleRegisterClick(event)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        )}
      </div>
      </div>

      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default Events;
