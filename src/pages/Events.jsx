import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoArrowForward, IoArrowDown } from "react-icons/io5";
import EventCard from "../components/events/EventCard";
import EventFilters from "../components/events/EventFilters";
import RegistrationModal from "../components/events/RegistrationModal";
import { tournamentAPI } from "../services/api";
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

        // Fetch tournaments only - matches belong inside their respective tournament
        const tournamentsData = await tournamentAPI.getAll(tournamentParams);
        const tournaments = tournamentsData.tournaments || [];

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
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(tournamentEvents);
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
        if (event.tournamentType !== "team" && event.tournamentType !== "both") return false;
      }
    }

    // Filter by status
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
      {/* ─── HERO BANNER ─── */}
      <section className="relative w-full py-24 sm:py-32 overflow-hidden bg-neutral-950 border-b border-white/5">
        {/* Full-bleed Background Image */}
        <div className="absolute inset-0">
          <img
            src={ebcHeroWebp}
            onError={(e) => {
              e.currentTarget.src = ebcHeroFallback;
            }}
            alt="The Arena Tournaments & Street Soccer Events"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle Vignette Overlay for readable text */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-transparent to-black/30" />
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full relative z-10">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black/60 border border-white/10 text-white/80 text-xs font-medium mb-6">
              <span>Addis Ababa &amp; Hawassa</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-4">
              Tournaments &amp; Events
            </h1>

            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed mb-8">
              Open street soccer knockout cups and showcase leagues across Ethiopia. Register your squad, track fixtures, and compete for the championship.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#events-list"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white font-medium text-xs rounded-lg transition-colors"
              >
                <span>View tournaments</span>
                <IoArrowDown className="text-xs" />
              </a>
              <Link
                to="/about-us"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/90 font-medium text-xs rounded-lg border border-white/10 transition-colors"
              >
                <span>About The Arena</span>
                <IoArrowForward className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EVENTS LIST & TOURNAMENT CALENDAR ─── */}
      <div id="events-list" className="relative scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs text-secondary-400 font-semibold uppercase tracking-wider mb-1">
                Calendar &amp; Brackets
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Current tournaments
              </h2>
            </div>

            {/* Filters */}
            <EventFilters 
              filter={filter} 
              onFilterChange={setFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between text-xs text-white/50">
            <p>
              <span className="text-white/90 font-mono font-medium">
                {filteredEvents.length}
              </span>{" "}
              {filteredEvents.length === 1 ? "tournament" : "tournaments"} available
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-secondary-400 hover:text-secondary-300 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="bg-[#12151d] border border-white/10 rounded-2xl overflow-hidden h-96 animate-pulse"
                >
                  <div className="h-48 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
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
              description="Try adjusting your filters, or check back soon for new tournaments."
              actionLabel="Clear filters"
              onAction={() => {
                setFilter("all");
                setStatusFilter("all");
              }}
            />
          ) : (
            <div className="space-y-12">
              {upcomingEvents.length === 0 && pastEvents.length > 0 && (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center max-w-xl mx-auto">
                  <p className="text-sm font-semibold text-white mb-1">
                    No active upcoming tournaments
                  </p>
                  <p className="text-xs text-white/60">
                    Explore our completed tournaments and results below.
                  </p>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="h-full">
                        <EventCard
                          event={event}
                          onRegister={() => handleRegisterClick(event)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="pt-6 border-t border-white/5">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Past tournaments
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Completed showdowns and champion records
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {pastEvents.map((event) => (
                      <div key={event.id} className="h-full">
                        <EventCard
                          event={event}
                          onRegister={() => handleRegisterClick(event)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
