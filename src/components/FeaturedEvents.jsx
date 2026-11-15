import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { tournamentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "./NotificationProvider";
import RegistrationModal from "./events/RegistrationModal";
import EmptyState from "./EmptyState";
import EventCard from "./events/EventCard";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import { IoChevronForward } from "react-icons/io5";

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
    let isMounted = true;
    const fetchUpcomingTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await tournamentAPI.getAll({
          limit: 20,
        });

        if (!isMounted) return;

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
              "Compete and represent your neighborhood in Ethiopia's street soccer tournaments.",
            image:
              absoluteMediaSrc(tournament.image) ||
              "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop",
            showRegisterButton,
          };
        });

        setEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch upcoming tournaments:", err);
        if (isMounted) {
          setError(err.message || "Failed to load tournaments");
          setEvents([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUpcomingTournaments();
    return () => {
      isMounted = false;
    };
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
    <section id="events" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white text-neutral-900 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 text-xs font-semibold text-secondary-600 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <span>Tournament Circuit</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 mb-3 uppercase">
            {isPastEventsView ? "Recent " : "Upcoming "}
            <span className="text-secondary-500">
              {isPastEventsView ? "Champions" : "Showdowns"}
            </span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {isPastEventsView
              ? "Completed brackets and champion squads from our Addis Ababa and Hawassa competitions."
              : "High-intensity street soccer tournaments hosted across local mini-stadiums. Bring your squad and compete for neighborhood glory."}
          </p>

          {/* Quick Metrics in Brand Orange */}
          <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-neutral-100">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-secondary-500 tabular-nums">12+</span>
              <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">Tournaments</span>
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <div>
              <span className="text-2xl sm:text-3xl font-black text-secondary-500 tabular-nums">1,000</span>
              <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">Mini-stadiums</span>
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <div>
              <span className="text-2xl sm:text-3xl font-black text-secondary-500 tabular-nums">200+</span>
              <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">Active squads</span>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden h-96 animate-pulse"
              >
                <div className="h-48 bg-neutral-100" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-neutral-100 rounded w-2/3" />
                  <div className="h-4 bg-neutral-100 rounded w-full" />
                  <div className="h-4 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            variant="error"
            theme="light"
            title="Unable to load tournaments"
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
                : "No upcoming tournaments"
            }
            description={
              isPastEventsView
                ? "Completed tournament results will appear here."
                : "New tournaments are scheduled soon. Check back or view the full calendar."
            }
            actionLabel="View calendar"
            actionTo="/events"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRegister={() => handleRegisterEvent(event)}
              />
            ))}
          </div>
        )}

        {/* Action Pair */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/events"
            className="h-11 px-7 rounded-lg font-bold text-xs text-white bg-secondary-500 hover:bg-secondary-600 uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <span>Explore all tournaments</span>
            <IoChevronForward className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/events"
            className="h-11 px-6 rounded-lg font-bold text-xs text-secondary-600 bg-secondary-50 hover:bg-secondary-100 border border-secondary-500/30 uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            <span>View season schedule</span>
          </Link>
        </div>
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
