import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tournamentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "./NotificationProvider";
import RegistrationModal from "./events/RegistrationModal";
import CountdownTimer from "./CountdownTimer";
import EmptyState from "./EmptyState";
import { absoluteMediaSrc } from "../utils/mediaUtils";

const FeaturedEvents = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [events, setEvents] = useState([]);
  const [isPastEventsView, setIsPastEventsView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isAuthenticated, isTeamLeader, isPlayer, isAdmin, user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const isAlreadyRegistered = (event) => {
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
  };

  useEffect(() => {
    const fetchUpcomingTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tournaments that are not completed
        // Request more than we need since we'll filter by status
        const data = await tournamentAPI.getAll({
          limit: 20,
        });

        const allTournaments = data.tournaments || [];

        // Filter out completed and cancelled tournaments, and those with displayStatus "completed"
        const activeTournaments = allTournaments.filter(
          (tournament) =>
            tournament.status !== "completed" &&
            tournament.status !== "cancelled" &&
            tournament.displayStatus !== "completed"
        );

        // Prefer featured (promoted) tournaments for this section
        const featuredTournaments = activeTournaments.filter(
          (tournament) => tournament.isPromoted
        );

        let isPast = false;
        let tournamentsToShow = [];

        if (featuredTournaments.length > 0) {
          tournamentsToShow = featuredTournaments.slice(0, 6);
        } else if (activeTournaments.length > 0) {
          tournamentsToShow = activeTournaments.slice(0, 6);
        } else {
          // Fallback to recent past/completed tournaments so page is never empty
          const pastTournaments = allTournaments
            .filter((t) => t.status !== "cancelled")
            .sort(
              (a, b) =>
                new Date(b.startDate || b.createdAt) -
                new Date(a.startDate || a.createdAt)
            )
            .slice(0, 6);
          if (pastTournaments.length > 0) {
            isPast = true;
            tournamentsToShow = pastTournaments;
          }
        }
        setIsPastEventsView(isPast);

        // Map tournaments from DB into the card shape used by this component
        const mapped = tournamentsToShow.map((tournament) => {
          const totalRegistrations =
            (tournament.registeredTeams?.length || 0) +
            (tournament.registeredPlayers?.length || 0);

          // Use displayStatus and registrationOpen from backend (calculated based on dates)
          const displayStatus = tournament.displayStatus || "upcoming";
          const registrationOpen = tournament.registrationOpen || false;

          // Check if registration deadline has passed
          const isRegistrationDeadlinePassed = tournament.registrationDeadline
            ? new Date(tournament.registrationDeadline).getTime() < new Date().getTime()
            : false;

          // Show register button only if registration is open AND deadline hasn't passed
          const showRegisterButton =
            registrationOpen && !isRegistrationDeadlinePassed;

          return {
            id: tournament._id,
            title: tournament.name,
            date: tournament.startDate,
            countdownDate: tournament.startDate,
            registrationDeadline: tournament.registrationDeadline,
            location: tournament.location || tournament.venue || "TBA",
            participants: totalRegistrations,
            maxParticipants: tournament.maxTeams || 0,
            minTeamMembers: tournament.minTeamMembers || 2,
            maxTeamMembers: tournament.maxTeamMembers || 10,
            tournamentType: tournament.tournamentType || "team",
            registeredPlayers: tournament.registeredPlayers || [],
            registeredTeams: tournament.registeredTeams || [],
            price: tournament.entryFee || 0,
            type: "tournament", // Distinguish tournaments from matches
            status: displayStatus, // Set the status for the badge
            registrationOpen: registrationOpen, // Set registration open status
            description:
              tournament.description ||
              "Upcoming tournament. Register now to secure your spot.",
            image:
              absoluteMediaSrc(tournament.image) ||
              "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
            // Show a clear badge when the tournament is featured
            badge: isPast
              ? "Completed"
              : tournament.isPromoted
              ? "Featured"
              : "Upcoming",
            link: `/events/tournament/${tournament._id}`,
            buttonText: showRegisterButton
              ? "Register Now"
              : "View Results & Details",
          };
        });

        setEvents(mapped);
      } catch (error) {
        console.error("Failed to fetch upcoming tournaments:", error);
        setError(error.message || "Failed to load tournaments");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTournaments();
  }, []);

  const badgeColors = {
    Featured: "bg-secondary-400 text-primary-950",
    Popular: "bg-secondary-500 text-primary-950",
    New: "bg-tertiary-400 text-primary-950",
    Completed: "bg-primary-900 text-white",
  };

  return (
    <section
      id="events"
      className="py-24 md:py-32 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-white via-primary-50/30 to-white relative overflow-hidden"
    >
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-tertiary-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 px-5 py-2.5 border border-primary-950/10 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <motion.div
                className="w-2 h-2 bg-secondary-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-primary-950 text-xs font-medium tracking-[0.2em] uppercase">
                Featured Events
              </span>
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="text-primary-950">
              {isPastEventsView ? "Recent " : "Upcoming "}
            </span>
            <span className="text-secondary-500">
              {isPastEventsView ? "Tournaments & Champions" : "Events"}
            </span>
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-primary-600 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {isPastEventsView
              ? "Relive recent tournaments, team brackets, and champions from our Seattle street soccer competitions."
              : "Discover upcoming tournaments and matches. Register now and compete for glory."}
          </motion.p>
        </motion.div>

        {/* Enhanced Events Grid */}
        {loading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className="bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
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
            actionLabel="Browse all events"
            actionTo="/events"
          />
        ) : events.length === 0 ? (
          <EmptyState
            variant="events"
            title={
              isPastEventsView
                ? "No past tournaments yet"
                : "No upcoming events"
            }
            description={
              isPastEventsView
                ? "Completed tournaments and champion results will show up here."
                : "New tournaments and matches are on the way. Check back soon or explore the full events calendar."
            }
            actionLabel="View all events"
            actionTo="/events"
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                className="group relative bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() =>
                  navigate(`/events/${event.type || "tournament"}/${event.id}`)
                }
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
                whileHover={{ y: -12, scale: 1.02 }}
              >
                {/* Image Container with Enhanced Effects */}
                <div className="relative h-64 md:h-72 overflow-hidden bg-primary-100">
                  <motion.img
                    src={absoluteMediaSrc(event.image) || event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    animate={{
                      scale: hoveredIndex === index ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                  {/* Multi-layer gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 via-transparent to-transparent" />

                  {/* Badge with enhanced styling */}
                  {event.badge && (
                    <motion.div
                      className="absolute top-4 right-4 z-10"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.4 + index * 0.1,
                        type: "spring",
                        stiffness: 200,
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-lg ${
                          badgeColors[event.badge] || "bg-secondary-400"
                        }`}
                      >
                        {event.badge}
                      </div>
                    </motion.div>
                  )}

                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%", rotate: 45 }}
                    animate={{
                      x: hoveredIndex === index ? "200%" : "-100%",
                    }}
                    transition={{ duration: 0.8 }}
                  />
                </div>

                {/* Enhanced Content Section */}
                <div className="p-6 md:p-8">
                  <motion.div
                    className="mb-5"
                    animate={{
                      y: hoveredIndex === index ? -3 : 0,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="text-xl md:text-2xl font-semibold text-primary-950 mb-3 leading-tight group-hover:text-secondary-600 transition-colors duration-300">
                      {event.title}
                    </h3>
                    <p className="text-sm md:text-base text-primary-600 mb-6 font-light leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  </motion.div>

                  {/* Enhanced Event Info */}
                  <div className="space-y-2.5 mb-6 border-t border-primary-200 pt-6">
                    {event.date && (
                      <motion.div
                        className="flex items-center gap-3 text-sm text-primary-700"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className="w-4 h-4 text-secondary-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </motion.div>
                    )}
                    {event.location && (
                      <motion.div
                        className="flex items-center gap-3 text-sm text-primary-700"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className="w-4 h-4 text-secondary-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-medium">{event.location}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Countdown Timer */}
                  {event.date && new Date(event.date) > new Date() && (
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-secondary-400 rounded-full" />
                        <p className="text-xs text-primary-600 uppercase tracking-wider font-medium">
                          Event Starts In
                        </p>
                      </div>
                      <CountdownTimer
                        targetDate={event.date}
                        registrationDeadline={event.registrationDeadline}
                      />
                    </div>
                  )}

                  {/* Enhanced Participants Progress */}
                  {event.participants !== undefined && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center text-xs text-primary-600 mb-2.5 font-medium">
                        <span className="uppercase tracking-wider">
                          Registered
                        </span>
                        <span className="text-secondary-600 font-semibold">
                          {event.participants}/{event.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-primary-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-secondary-400 to-secondary-500 h-full rounded-full shadow-sm"
                          initial={{ width: 0 }}
                          whileInView={{
                            width: `${
                              (event.participants / event.maxParticipants) * 100
                            }%`,
                          }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1.2,
                            delay: 0.5 + index * 0.1,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Enhanced Button / Registered state */}
                  {event.type === "tournament" && (
                    <motion.div
                      animate={{
                        y: hoveredIndex === index ? -2 : 0,
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {isAlreadyRegistered(event) ? (
                        <div className="group/btn relative inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 border border-green-500/70 bg-green-500/5 text-green-600 text-xs font-semibold uppercase tracking-wider rounded-lg">
                          <span className="relative z-10 flex items-center gap-2">
                            Registered
                            <svg
                              className="w-4 h-4 relative z-10"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        </div>
                      ) : (
                        event.buttonText === "Register Now" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                navigate("/login");
                              } else if (
                                event.tournamentType === "team" &&
                                !isTeamLeader &&
                                !isAdmin
                              ) {
                                showError(
                                  "Only team leaders can register for team tournaments."
                                );
                              } else {
                                setSelectedEvent(event);
                              }
                            }}
                            className="group/btn relative inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-950 text-white text-sm font-semibold uppercase tracking-wider rounded-lg overflow-hidden transition-all duration-300 hover:text-secondary-200"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              {event.buttonText || "Learn More"}
                              <motion.svg
                                className="w-4 h-4 relative z-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                animate={{
                                  x: hoveredIndex === index ? 4 : 0,
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </motion.svg>
                            </span>
                            {/* Button hover effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-400"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "0%" }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                            />
                            {/* Shine effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "200%" }}
                              transition={{ duration: 0.6 }}
                            />
                          </button>
                        )
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Enhanced Hover Border Glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-secondary-400/0 pointer-events-none"
                  animate={{
                    borderColor:
                      hoveredIndex === index
                        ? "rgba(250, 204, 21, 0.4)"
                        : "rgba(250, 204, 21, 0)",
                    boxShadow:
                      hoveredIndex === index
                        ? "0 0 30px rgba(250, 204, 21, 0.2)"
                        : "0 0 0px rgba(250, 204, 21, 0)",
                  }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Enhanced View All Link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link
            to="/events"
            className="group relative inline-flex items-center gap-3 px-8 py-4 border-2 border-primary-950/20 text-primary-950 text-sm font-semibold uppercase tracking-wider rounded-full bg-white/50 backdrop-blur-sm hover:border-secondary-500 hover:text-secondary-600 hover:bg-secondary-50/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <span>View All Events</span>
            <motion.svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ x: [0, 6, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </motion.svg>
            {/* Hover background */}
            <motion.div
              className="absolute inset-0 rounded-full bg-secondary-100/50"
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.div>
      </div>

      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
};

export default FeaturedEvents;
