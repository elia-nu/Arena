import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tournamentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "./NotificationProvider";
import RegistrationModal from "./events/RegistrationModal";
import EmptyState from "./EmptyState";
import EventCard from "./events/EventCard";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import DecryptedText from "./reactbits/DecryptedText";
import ShinyText from "./reactbits/ShinyText";

const FeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [isPastEventsView, setIsPastEventsView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isAuthenticated, isTeamLeader, isAdmin } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await tournamentAPI.getAll({
          limit: 20,
        });

        const allTournaments = data.tournaments || [];

        const activeTournaments = allTournaments.filter(
          (tournament) =>
            tournament.status !== "completed" &&
            tournament.status !== "cancelled" &&
            tournament.displayStatus !== "completed"
        );

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

        const mapped = tournamentsToShow.map((tournament) => {
          const totalRegistrations =
            (tournament.registeredTeams?.length || 0) +
            (tournament.registeredPlayers?.length || 0);

          const displayStatus = tournament.displayStatus || "upcoming";
          const registrationOpen = tournament.registrationOpen || false;

          const isRegistrationDeadlinePassed = tournament.registrationDeadline
            ? new Date(tournament.registrationDeadline).getTime() < new Date().getTime()
            : false;

          const showRegisterButton =
            registrationOpen && !isRegistrationDeadlinePassed;

          return {
            id: tournament._id,
            title: tournament.name,
            date: tournament.startDate,
            countdownDate: tournament.startDate,
            registrationDeadline: tournament.registrationDeadline,
            location: tournament.location || tournament.venue || "Addis Ababa, Ethiopia",
            participants: totalRegistrations,
            maxParticipants: tournament.maxTeams || 0,
            minTeamMembers: tournament.minTeamMembers || 2,
            maxTeamMembers: tournament.maxTeamMembers || 10,
            tournamentType: tournament.tournamentType || "team",
            registeredPlayers: tournament.registeredPlayers || [],
            registeredTeams: tournament.registeredTeams || [],
            price: tournament.entryFee || 0,
            type: "tournament",
            status: displayStatus,
            registrationOpen: registrationOpen,
            description:
              tournament.description ||
              "Compete for glory and dominate the pitch in this Ethiopian street soccer showdown.",
            image:
              absoluteMediaSrc(tournament.image) ||
              "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop",
            showRegisterButton,
          };
        });

        setEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch upcoming tournaments:", err);
        setError(err.message || "Failed to load tournaments");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTournaments();
  }, []);

  const handleRegisterEvent = (event) => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (
      event.tournamentType === "team" &&
      !isTeamLeader &&
      !isAdmin
    ) {
      showError("Only team leaders can register for team tournaments.");
    } else {
      setSelectedEvent(event);
    }
  };

  return (
    <section
      id="events"
      className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-white text-neutral-900 overflow-hidden border-t-4 border-secondary-500"
    >
      {/* ── Background Decoration Layer ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dense orange dot grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="events-grid-v2" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.4" fill="rgba(254,87,35,0.18)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#events-grid-v2)" />
        </svg>

        {/* Large orange blob — top right */}
        <div
          className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full blur-[200px] opacity-30"
          style={{ background: "radial-gradient(circle, #fe5723 0%, #ff9a56 50%, transparent 80%)" }}
        />
        {/* Medium orange blob — bottom left */}
        <div
          className="absolute -bottom-40 -left-48 w-[550px] h-[550px] rounded-full blur-[180px] opacity-20"
          style={{ background: "radial-gradient(circle, #ff7a40 0%, #fe5723 60%, transparent 100%)" }}
        />

        {/* Top-right diagonal stripe pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 overflow-hidden">
          <svg width="384" height="384" viewBox="0 0 384 384" fill="none">
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <line key={i} x1={i*44} y1="0" x2="384" y2={384 - i*44} stroke="#fe5723" strokeWidth="1.5" strokeOpacity="0.10" />
            ))}
          </svg>
        </div>

        {/* Bottom-left diagonal stripe */}
        <div className="absolute bottom-0 left-0 w-72 h-72 overflow-hidden">
          <svg width="288" height="288" viewBox="0 0 288 288" fill="none">
            {[0,1,2,3,4,5,6].map(i => (
              <line key={i} x1="0" y1={i*48} x2={288-i*48} y2="288" stroke="#fe5723" strokeWidth="1.5" strokeOpacity="0.10" />
            ))}
          </svg>
        </div>

        {/* Vertical orange side rails */}
        <div className="absolute left-0 top-32 bottom-32 w-1.5 bg-gradient-to-b from-transparent via-secondary-500/50 to-transparent rounded-r-full" />
        <div className="absolute right-0 top-32 bottom-32 w-1.5 bg-gradient-to-b from-transparent via-secondary-500/50 to-transparent rounded-l-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20 flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Tactical Badge Pill */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-secondary-400/40 bg-gradient-to-r from-secondary-50 to-orange-50 backdrop-blur-md mb-6 shadow-sm shadow-secondary-500/10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-500 shadow-[0_0_10px_#fe5723]" />
            </span>
            <DecryptedText
              text="ARENA TOURNAMENT CIRCUIT"
              speed={28}
              maxIterations={12}
              className="text-secondary-700 text-xs font-black tracking-[0.25em] uppercase"
            />
          </div>

          {/* Section Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tight text-neutral-950 mb-5 leading-none">
            {isPastEventsView ? "Recent " : "Upcoming "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-secondary-600 to-secondary-400">
                {isPastEventsView ? "Champions" : "Showdowns"}
              </span>
              {/* Underline squiggle */}
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M0,4 Q37.5,0 75,4 Q112.5,8 150,4 Q187.5,0 225,4 Q262.5,8 300,4" stroke="#fe5723" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </h2>

          {/* Section Tagline */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-secondary-400" />
            <p className="text-secondary-600 text-xs sm:text-sm font-black tracking-[0.3em] uppercase">
              <ShinyText
                text={
                  isPastEventsView
                    ? "RELIVE THE CHAMPIONSHIP MOMENTS"
                    : "STEP INTO THE CAGE • COMPETE & WIN"
                }
                speed={4}
                className="text-secondary-600"
              />
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-secondary-400" />
          </div>

          <p className="text-neutral-600 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            {isPastEventsView
              ? "Relive recent tournaments, team brackets, and champions from our Addis Ababa and Hawassa street soccer competitions."
              : "High-intensity street soccer tournaments across Addis Ababa and Hawassa. Bring your squad, dominate the pitch, and claim the championship trophy."}
          </p>

          {/* Orange stats bar below headline */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
            {[
              { label: "Active Tournaments", value: "12+" },
              { label: "Prize Pool", value: "$10K" },
              { label: "Registered Teams", value: "200+" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-secondary-500 leading-none">{s.value}</div>
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-neutral-50 border-2 border-secondary-100/80 rounded-3xl overflow-hidden animate-pulse h-[460px]"
              >
                <div className="h-60 bg-gradient-to-b from-secondary-50/60 to-orange-50/30" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-secondary-100/60 rounded-xl w-3/4" />
                  <div className="h-4 bg-neutral-100 rounded-lg w-full" />
                  <div className="h-4 bg-neutral-50 rounded-lg w-2/3" />
                  <div className="h-12 bg-secondary-50 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            variant="error"
            theme="light"
            title="Unable to load events"
            description={error}
            actionLabel="Browse all events"
            actionTo="/events"
          />
        ) : events.length === 0 ? (
          <EmptyState
            variant="events"
            theme="light"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-14 md:mb-18">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRegister={() => handleRegisterEvent(event)}
              />
            ))}
          </div>
        )}

        {/* CTA row */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Link
            to="/events"
            className="group relative inline-flex items-center gap-3 px-9 py-4 font-black text-sm uppercase tracking-widest text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
              boxShadow: "0 8px 30px rgba(254,87,35,0.35)",
            }}
          >
            <span>Explore All Tournaments</span>
            <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
          </Link>
          <Link
            to="/events"
            className="group inline-flex items-center gap-2.5 px-7 py-4 font-bold text-sm uppercase tracking-widest text-secondary-600 rounded-full border-2 border-secondary-300 hover:border-secondary-500 hover:bg-secondary-50 transition-all duration-300"
          >
            <span>View Schedule</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
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
