import { useState } from "react";
import { motion } from "framer-motion";
import TournamentManagement from "./TournamentManagement";
import MatchManagement from "./MatchManagement";
import EventMediaManagement from "./EventMediaManagement";

const EventsManagement = () => {
  const [activeView, setActiveView] = useState("tournaments");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 sm:gap-4 border-b-2 border-primary-200">
        <button
          onClick={() => setActiveView("tournaments")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === "tournaments"
              ? "border-b-4 border-tertiary-500 text-primary-950"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          Tournaments
        </button>
        <button
          onClick={() => setActiveView("matches")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === "matches"
              ? "border-b-4 border-tertiary-500 text-primary-950"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          Matches
        </button>
        <button
          onClick={() => setActiveView("event-media")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === "event-media"
              ? "border-b-4 border-tertiary-500 text-primary-950"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          Event media
        </button>
      </div>

      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === "tournaments" && (
          <TournamentManagement
            onOpenEventMedia={() => setActiveView("event-media")}
          />
        )}
        {activeView === "matches" && <MatchManagement />}
        {activeView === "event-media" && <EventMediaManagement />}
      </motion.div>
    </div>
  );
};

export default EventsManagement;
