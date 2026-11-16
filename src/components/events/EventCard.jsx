import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "../CountdownTimer";
import { useAuth } from "../../context/AuthContext";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import { IoCalendarOutline, IoLocationOutline, IoTrophyOutline, IoChevronForward } from "react-icons/io5";

const EventCard = ({ event, onRegister, className = "" }) => {
  const navigate = useNavigate();
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
    <div
      onClick={handleCardClick}
      className={`group cursor-pointer bg-[#12151d] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full hover:border-white/20 transition-colors ${className}`}
    >
      {/* ── Image & Badges ── */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-black/40 flex-shrink-0">
        <img
          src={
            absoluteMediaSrc(event.image) ||
            event.image ||
            "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
          }
          alt={event.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#12151d] via-transparent to-black/30" />

        {/* Top Badges Row */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/90">
            {derivedStatus === "live" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-400 font-semibold text-[11px]">Live match</span>
              </>
            ) : derivedStatus === "upcoming" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                <span className="text-white/80 text-[11px]">Upcoming</span>
              </>
            ) : (
              <span className="text-white/50 text-[11px]">Completed</span>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/70 backdrop-blur-sm border border-white/10 text-white tabular-nums">
            {event.price > 0 ? `$${event.price}` : "Free entry"}
          </div>
        </div>

        {/* Format Tag */}
        <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-white/70 text-[11px]">
          {event.tournamentType
            ? `${event.tournamentType === "both" ? "Team & Solo" : event.tournamentType} division`
            : "Street soccer"}
        </div>
      </div>

      {/* ── Card Content ── */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-base font-semibold text-white leading-snug mb-1.5 group-hover:text-secondary-400 transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-white/60 text-xs line-clamp-2 leading-relaxed mb-4">
              {event.description}
            </p>
          )}

          {/* Meta Details */}
          <div className="space-y-2 py-3 border-y border-white/5 mb-4 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <IoLocationOutline className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="truncate">{event.location || "Addis Ababa, Ethiopia"}</span>
            </div>

            {event.maxParticipants > 0 && (
              <div className="flex items-center gap-2">
                <IoTrophyOutline className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span>
                  Max {event.maxParticipants} {event.tournamentType === "individual" ? "players" : "teams"}
                </span>
              </div>
            )}
          </div>

          {/* Countdown (Upcoming only) */}
          {derivedStatus === "upcoming" && countdownTarget && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-white/50 mb-1.5 font-medium">
                <span>Kickoff countdown</span>
              </div>
              <CountdownTimer
                targetDate={countdownTarget}
                registrationDeadline={event.registrationDeadline}
                theme="dark"
              />
            </div>
          )}

          {/* Capacity Progress Bar */}
          {derivedStatus !== "completed" && event.maxParticipants > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white/50">Roster capacity</span>
                <span className="text-white/80 font-mono text-[11px] tabular-nums">
                  {event.participants} / {event.maxParticipants} slots
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-secondary-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3 mt-auto">
          <span className="text-xs text-white/60 group-hover:text-white transition-colors inline-flex items-center gap-1">
            <span>View event</span>
            <IoChevronForward className="w-3.5 h-3.5 text-white/40" />
          </span>

          {event.type === "tournament" && (
            <div>
              {isAlreadyRegistered ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  ✓ Registered
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
                  className="h-8 px-3.5 rounded-lg font-medium text-xs text-white bg-secondary-500 hover:bg-secondary-600 transition-colors"
                >
                  Register
                </button>
              ) : (
                <span className="text-xs text-white/40 font-medium">Closed</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
