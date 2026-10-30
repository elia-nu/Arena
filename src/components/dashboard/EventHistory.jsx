import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  IoCalendar,
  IoLocation,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoFilter,
  IoTrophy,
  IoPeople,
} from "react-icons/io5";

const EventHistory = ({ events = [], matches = [], nonProfitActivities = [] }) => {
  const [filter, setFilter] = useState("all"); // all, upcoming, past, completed

  // Combine all event types
  const allEvents = useMemo(() => {
    const combined = [];

    // Add tournaments
    events.forEach((event) => {
      combined.push({
        ...event,
        type: "tournament",
        eventDate: event.date,
      });
    });

    // Add matches
    matches.forEach((match) => {
      combined.push({
        id: match._id || match.id,
        name: `${match.team1?.team?.name || match.team1?.player?.username || "TBD"} vs ${match.team2?.team?.name || match.team2?.player?.username || "TBD"}`,
        type: "match",
        eventDate: match.scheduledDate,
        location: match.location,
        status: match.status,
        result: match.result,
        tournament: match.tournament?.name,
      });
    });

    // Add non-profit activities
    nonProfitActivities.forEach((activity) => {
      combined.push({
        id: activity._id || activity.id,
        name: activity.title,
        type: "nonprofit",
        eventDate: activity.date,
        location: activity.venue,
        status: "joined",
        description: activity.description,
      });
    });

    return combined.sort((a, b) => {
      const dateA = new Date(a.eventDate || a.date || 0);
      const dateB = new Date(b.eventDate || b.date || 0);
      return dateB - dateA; // Most recent first
    });
  }, [events, matches, nonProfitActivities]);

  // Filter events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return allEvents.filter((event) => {
      const eventDate = new Date(event.eventDate || event.date || 0);
      switch (filter) {
        case "upcoming":
          return eventDate > now && event.status !== "completed" && event.status !== "cancelled";
        case "past":
          return eventDate < now || event.status === "completed" || event.status === "cancelled";
        case "completed":
          return event.status === "completed";
        default:
          return true;
      }
    });
  }, [allEvents, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = allEvents.filter(
      (e) => new Date(e.eventDate || e.date || 0) > now && e.status !== "completed" && e.status !== "cancelled"
    ).length;
    const completed = allEvents.filter((e) => e.status === "completed").length;
    const total = allEvents.length;

    return { upcoming, completed, total };
  }, [allEvents]);

  const getEventTypeIcon = (type) => {
    switch (type) {
      case "tournament":
        return <IoTrophy className="text-amber-500" />;
      case "match":
        return <IoPeople className="text-blue-500" />;
      case "nonprofit":
        return <IoPeople className="text-green-500" />;
      default:
        return <IoCalendar className="text-primary-500" />;
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case "tournament":
        return "Tournament";
      case "match":
        return "Match";
      case "nonprofit":
        return "Non-Profit Activity";
      default:
        return "Event";
    }
  };

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-primary-600 mb-2">No event history yet.</p>
        <p className="text-sm text-primary-500">Register for tournaments or join activities to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-600 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-green-900">{stats.upcoming}</p>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Completed</p>
          <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <IoFilter className="text-primary-600" />
        <span className="text-sm font-medium text-primary-700">Filter:</span>
        {["all", "upcoming", "past", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-900 text-white"
                : "bg-primary-100 text-primary-700 hover:bg-primary-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-primary-600">No events found for this filter.</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const eventDate = new Date(event.eventDate || event.date || 0);
            const isUpcoming = eventDate > new Date() && event.status !== "completed" && event.status !== "cancelled";

            return (
              <motion.div
                key={event.id || index}
                className="bg-white border-2 border-primary-200 rounded-xl p-5 hover:border-tertiary-500 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-secondary-600">{event.name}</h3>
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                          {getEventTypeLabel(event.type)}
                        </span>
                        {event.type === "tournament" &&
                          event.registrationSource && (
                            <span className="px-2 py-0.5 bg-secondary-50 text-secondary-700 rounded text-xs font-medium">
                              {event.registrationSource === "team"
                                ? "Team Registered"
                                : "Individual Registered"}
                            </span>
                          )}
                        {event.status === "completed" && (
                          <IoCheckmarkCircle className="text-green-500 text-xl" />
                        )}
                        {event.status === "cancelled" && (
                          <IoCloseCircle className="text-red-500 text-xl" />
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-primary-600">
                        <div className="flex items-center gap-2">
                          <IoCalendar className="text-tertiary-500" />
                          <span>
                            {eventDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {isUpcoming && (
                              <span className="ml-2 text-xs text-primary-500">
                                ({Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))} days away)
                              </span>
                            )}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <IoLocation className="text-tertiary-500" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.tournament && (
                          <div className="text-xs text-primary-500">
                            Part of: {event.tournament}
                          </div>
                        )}
                      </div>
                      {event.result && (
                        <div className="mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              event.result === "win" || (event.result.winner && event.result.winner.toString() === (event.userId || "").toString())
                                ? "bg-green-100 text-green-800"
                                : event.result === "loss"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.result === "win" || (event.result.winner && event.result.winner.toString() === (event.userId || "").toString())
                              ? "Won"
                              : event.result === "loss"
                              ? "Lost"
                              : "Draw"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-2">
                    {event.paymentStatus && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.paymentStatus}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : event.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : isUpcoming
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {event.status || (isUpcoming ? "Upcoming" : "Past")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventHistory;
