import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "../CountdownTimer";
import { useAuth } from "../../context/AuthContext";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import SpotlightCard from "../reactbits/SpotlightCard";
import { IoCalendarOutline, IoLocationOutline, IoTrophyOutline, IoFlame } from "react-icons/io5";

const EventCard = ({ event, onRegister, className = "" }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();

  const progress =
    event.maxParticipants > 0
      ? Math.min(100, Math.round((event.participants / event.maxParticipants) * 100))
      : 0;

  const countdownTarget = event.countdownDate || event.date;

  const isRegistrationDeadlinePassed = event.registrationDeadline
    ? new Date(event.registrationDeadline).getTime() < new Date().getTime()
    : false;

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

    if (Array.isArray(event.registeredPlayers)) {
      const isPlayer = event.registeredPlayers.some((reg) => {
        const playerId = normalizeId(reg.player || reg.playerId || reg);
        return playerId && playerId.toString() === userId.toString();
      });
      if (isPlayer) return true;
    }

    if (Array.isArray(event.registeredTeams)) {
      const isTeam = event.registeredTeams.some((reg) => {
        const team = reg.team || reg;
        if (!team) return false;
        const leaderId = normalizeId(team.leader);
        if (leaderId && leaderId.toString() === userId.toString()) return true;

        if (Array.isArray(team.members)) {
          return team.members.some((member) => {
            const memberId = normalizeId(member);
            return memberId && memberId.toString() === userId.toString();
          });
        }
        return false;
      });
      if (isTeam) return true;
    }

    return false;
  }, [event, user]);

  const now = new Date().getTime();
  const eventStart = event?.date ? new Date(event.date).getTime() : null;
  const eventEnd = event?.endDate ? new Date(event.endDate).getTime() : null;
  const derivedStatus =
    eventEnd && now >= eventEnd
      ? "completed"
      : eventStart && now >= eventStart
      ? "live"
      : "upcoming";

  const handleCardClick = () => {
    navigate(`/events/${event.type || "tournament"}/${event.id}`);
  };

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBA";

  return (
    <SpotlightCard
      className={`group cursor-pointer bg-white border-2 border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-2 ${className}`}
      spotlightColor="rgba(254, 87, 35, 0.14)"
      borderColor="rgba(254, 87, 35, 0.60)"
      defaultBorder="rgba(0, 0, 0, 0.09)"
      glowRadius={420}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Orange top-edge accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-30 rounded-t-3xl"
        style={{
          background: isHovered
            ? "linear-gradient(90deg, #fe5723 0%, #ff9a56 50%, #fe5723 100%)"
            : "linear-gradient(90deg, transparent, rgba(254,87,35,0.3), transparent)",
          transition: "background 0.4s ease",
        }}
      />

      {/* ── Image & Sport Badges ── */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-neutral-100 flex-shrink-0">
        <img
          src={
            absoluteMediaSrc(event.image) ||
            event.image ||
            "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
          }
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Cinematic gradient for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
        {/* Orange tinted hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(254,87,35,0.25) 0%, transparent 60%)" }}
        />

        {/* Top Badges Row */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 z-10">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-neutral-200/80 backdrop-blur-md shadow-md">
            {derivedStatus === "live" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  LIVE MATCH
                </span>
              </>
            ) : derivedStatus === "upcoming" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-600">
                  UPCOMING
                </span>
              </>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                FINAL SCORE
              </span>
            )}
          </div>

          {/* Price / Entry Fee Pill — full orange gradient */}
          <div
            className="px-3 py-1.5 rounded-full font-black text-xs tracking-wider uppercase text-white"
            style={{
              background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
              boxShadow: "0 4px 14px rgba(254,87,35,0.45)",
            }}
          >
            {event.price > 0 ? `$${event.price}` : "FREE ENTRY"}
          </div>
        </div>

        {/* Floating Tournament Format Tag — orange accent border */}
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 border border-secondary-300/70 backdrop-blur-md shadow-sm">
          <IoFlame className="w-3.5 h-3.5 text-secondary-500" />
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
            {event.tournamentType
              ? `${event.tournamentType === "both" ? "Team & Solo" : event.tournamentType} Division`
              : "Street Soccer"}
          </span>
        </div>

        {/* Decorative orange corner triangle */}
        <div className="absolute bottom-0 right-0 w-0 h-0 border-r-[48px] border-b-[48px] border-r-secondary-500/40 border-b-secondary-500/40 border-l-transparent border-t-transparent z-10 pointer-events-none" />
      </div>

      {/* ── Card Content ── */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow justify-between">
        <div>
          {/* Category tag */}
          <div className="flex items-start gap-2 mb-2 mt-1">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary-600 bg-secondary-50 border border-secondary-200/70 px-2.5 py-1 rounded-full whitespace-nowrap">
              ⚽ Arena FC
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 leading-tight mb-2 group-hover:text-secondary-600 transition-colors duration-300">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-neutral-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4 font-normal">
              {event.description}
            </p>
          )}

          {/* Sports Meta Details */}
          <div className="space-y-2 py-3 border-y-2 border-dashed border-secondary-100 mb-4">
            {/* Date */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-800">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #fe5723, #ff7a40)" }}
              >
                <IoCalendarOutline className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold">{formattedDate}</span>
            </div>

            {/* Location / Pitch */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-800">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #fe5723, #ff7a40)" }}
              >
                <IoLocationOutline className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold truncate">
                {event.location || "Seattle, WA"}
              </span>
            </div>

            {/* Division Limit */}
            {event.maxParticipants > 0 && (
              <div className="flex items-center gap-2.5 text-xs text-neutral-800">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #fe5723, #ff7a40)" }}
                >
                  <IoTrophyOutline className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold">
                  Max {event.maxParticipants} {event.tournamentType === "individual" ? "Players" : "Teams"}
                </span>
              </div>
            )}
          </div>

          {/* Sports Countdown Widget (Upcoming only) */}
          {derivedStatus === "upcoming" && countdownTarget && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-neutral-500">KICKOFF IN</span>
                <span
                  className="font-black px-2.5 py-0.5 rounded-full text-white text-[9px]"
                  style={{ background: "linear-gradient(90deg, #fe5723, #ff7a40)" }}
                >
                  COUNTDOWN
                </span>
              </div>
              <CountdownTimer
                targetDate={countdownTarget}
                registrationDeadline={event.registrationDeadline}
                theme="light"
              />
            </div>
          )}

          {/* Registration Capacity Progress Bar */}
          {derivedStatus !== "completed" && event.maxParticipants > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="text-neutral-500">ROSTER CAPACITY</span>
                <span className="text-secondary-600 font-black">
                  {event.participants} / {event.maxParticipants} SLOTS
                </span>
              </div>
              <div className="w-full bg-secondary-50 border border-secondary-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #fe5723 0%, #ff9a56 100%)",
                    boxShadow: "0 0 10px rgba(254,87,35,0.5)",
                    width: `${progress}%`,
                  }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Action Buttons Footer ── */}
        <div className="pt-4 border-t-2 border-dashed border-secondary-100 flex items-center justify-between gap-3 mt-auto">
          {/* Details link */}
          <span className="text-xs font-black uppercase tracking-widest text-secondary-500 group-hover:text-secondary-600 transition-colors flex items-center gap-1.5">
            Details
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </span>

          {/* Registration Button or Status */}
          {event.type === "tournament" && (
            <div>
              {isAlreadyRegistered ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider">
                  <span>✓</span> Registered
                </span>
              ) : showRegisterButton ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRegister) {
                      onRegister();
                    } else {
                      navigate(`/events/tournament/${event.id}`);
                    }
                  }}
                  className="relative px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
                    boxShadow: "0 4px 14px rgba(254,87,35,0.40)",
                  }}
                >
                  Enter Event
                </button>
              ) : (
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  View Results
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
};

export default EventCard;
