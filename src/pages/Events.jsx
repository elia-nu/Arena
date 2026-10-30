import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../components/events/EventCard";
import EventFilters from "../components/events/EventFilters";
import RegistrationModal from "../components/events/RegistrationModal";
import { tournamentAPI, matchAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";

const Events = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-tertiary-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.25, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        {/* Enhanced Header Section */}
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
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 px-5 py-2.5 border border-primary-950/10 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <motion.div
                className="w-2 h-2 bg-secondary-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-primary-950 text-xs font-medium tracking-[0.2em] uppercase">
                All Events
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-primary-950">Upcoming </span>
            <span className="text-secondary-500">Events</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Join tournaments, matches, and competitions. Register now and
            compete for glory.
          </motion.p>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-8"
        >
          <EventFilters 
            filter={filter} 
            onFilterChange={setFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </motion.div>

        {/* Enhanced Results Count */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-primary-600 font-medium">
            <span className="text-secondary-600 font-semibold">
              {filteredEvents.length}
            </span>{" "}
            {filteredEvents.length === 1 ? "event" : "events"} found
          </p>
          {filter !== "all" && (
            <motion.button
              onClick={() => setFilter("all")}
              className="text-xs text-primary-500 hover:text-secondary-600 uppercase tracking-wider transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear filters
            </motion.button>
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
                className="p-6 rounded-2xl bg-secondary-50 border border-secondary-200 text-center max-w-2xl mx-auto"
              >
                <p className="text-secondary-900 font-semibold mb-1">
                  Championship Season Update
                </p>
                <p className="text-sm text-primary-700">
                  There are no open upcoming tournaments right now. Explore our past completed tournaments and champion results below!
                </p>
              </motion.div>
            )}

            {upcomingEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl font-semibold text-primary-950 mb-6">
                  Upcoming Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.8 + index * 0.1,
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
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <div className="mb-6">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="text-primary-950">Past </span>
                    <span className="text-secondary-500">Events</span>
                  </h2>
                  <p className="text-sm md:text-base text-primary-600 font-light mt-2">
                    Relive previous tournaments, matches, and competitions.
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
