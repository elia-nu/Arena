import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "../CountdownTimer";
import { useAuth } from "../../context/AuthContext";
import { absoluteMediaSrc } from "../../utils/mediaUtils";

const EventCard = ({ event, onRegister }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const progress =
    event.maxParticipants > 0
      ? (event.participants / event.maxParticipants) * 100
      : 0;

  // Always use the start date for countdown (event.date is the start date)
  const countdownTarget = event.countdownDate || event.date;

  // Check if registration deadline has passed
  const isRegistrationDeadlinePassed = event.registrationDeadline
    ? new Date(event.registrationDeadline).getTime() < new Date().getTime()
    : false;

  // Show register button only if registration is open AND deadline hasn't passed
  const showRegisterButton =
    event.registrationOpen && !isRegistrationDeadlinePassed;

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

  const now = new Date().getTime();
  const eventStart = event?.date ? new Date(event.date).getTime() : null;
  const eventEnd = event?.endDate ? new Date(event.endDate).getTime() : null;
  const derivedStatus = eventEnd && now >= eventEnd
    ? "completed"
    : eventStart && now >= eventStart
      ? "live"
      : "upcoming";

  const formatStatus = (status) => {
    if (status === "completed") return "PAST";
    return status === "live" ? "LIVE" : "UPCOMING";
  };

  const statusColors = {
    upcoming: "bg-orange-500 text-white",
    live: "bg-red-500 text-white",
    completed: "bg-primary-500 text-white",
  };

  const handleCardClick = () => {
    navigate(`/events/${event.type}/${event.id}`);
  };

  return (
    <motion.div
      className="group relative bg-white border border-primary-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col cursor-pointer"
      whileHover={{ y: -12, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={handleCardClick}
    >
      {/* Enhanced Image Section */}
      {event.image && (
        <div className="relative h-64 md:h-72 overflow-hidden bg-primary-100">
          <motion.img
            src={absoluteMediaSrc(event.image) || event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.15 : 1,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 via-transparent to-transparent" />

          {/* Enhanced Badge Overlay */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            <motion.span
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-lg ${
                statusColors[derivedStatus] || statusColors.upcoming
              }`}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
            >
              {formatStatus(derivedStatus)}
            </motion.span>
          </div>

          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%", rotate: 45 }}
            animate={{
              x: isHovered ? "200%" : "-100%",
            }}
            transition={{ duration: 0.8 }}
          />
        </div>
      )}

      {/* Enhanced Content Section */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col flex-grow">
        {/* Badge - if no image */}
        {!event.image && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <motion.span
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                statusColors[derivedStatus] || statusColors.upcoming
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {formatStatus(derivedStatus)}
            </motion.span>
          </div>
        )}

        {/* Enhanced Title */}
        <motion.h3
          className="text-xl md:text-2xl font-semibold text-primary-950 mb-3 leading-tight group-hover:text-secondary-600 transition-colors duration-300"
          animate={{
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {event.title}
        </motion.h3>

        {/* Enhanced Description */}
        {event.description && (
          <p className="text-sm md:text-base text-primary-600 mb-6 font-light leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Enhanced Event Details */}
        <div className="space-y-2.5 mb-6 border-t border-primary-200 pt-6">
          <motion.div
            className="flex items-center gap-3 text-sm text-primary-700"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 text-secondary-500 flex-shrink-0"
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
          <motion.div
            className="flex items-center gap-3 text-sm text-primary-700"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 text-secondary-500 flex-shrink-0"
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
          <motion.div
            className="flex items-center gap-3 text-sm text-primary-700"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 text-secondary-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="font-medium capitalize">
              {event.type === "tournament" && event.tournamentType
                ? `${event.tournamentType === "both" ? "Team/Individual" : event.tournamentType} Tournament`
                : event.type}
            </span>
          </motion.div>
        </div>

        {/* Minimal Countdown Timer */}
        {derivedStatus === "upcoming" && countdownTarget && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-secondary-400 rounded-full" />
              <p className="text-xs text-primary-600 uppercase tracking-wider font-medium">
                Event Starts In
              </p>
            </div>
            <CountdownTimer
              targetDate={countdownTarget}
              registrationDeadline={event.registrationDeadline}
            />
          </div>
        )}

        {/* Enhanced Registration Progress */}
        {derivedStatus !== "completed" && (
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs text-primary-600 mb-2.5 font-medium">
              <span className="uppercase tracking-wider">Registered</span>
              <span className="text-secondary-600 font-semibold">
                {event.participants}/{event.maxParticipants}
              </span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-secondary-400 to-secondary-500 h-full rounded-full shadow-sm"
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Register Button */}
        <div className="flex justify-end items-end pt-6 border-t border-primary-200 mt-auto gap-4">
          {event.type === "tournament" && (
            <>
              {isAlreadyRegistered ? (
                <div className="group/btn relative inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-green-500/70 bg-green-500/5 text-green-600 text-xs font-semibold uppercase tracking-wider rounded-lg flex-shrink-0">
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
              ) : showRegisterButton ? (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRegister) onRegister();
                  }}
                  className="group/btn relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-950 text-white text-sm font-semibold uppercase tracking-wider rounded-lg overflow-hidden transition-all duration-300 hover:text-secondary-200 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Register
                    <motion.svg
                      className="w-4 h-4 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{
                        x: isHovered ? 4 : 0,
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
                </motion.button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Hover Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-secondary-400/0 pointer-events-none"
        animate={{
          borderColor: isHovered
            ? "rgba(250, 204, 21, 0.4)"
            : "rgba(250, 204, 21, 0)",
          boxShadow: isHovered
            ? "0 0 30px rgba(250, 204, 21, 0.2)"
            : "0 0 0px rgba(250, 204, 21, 0)",
        }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};

export default EventCard;
