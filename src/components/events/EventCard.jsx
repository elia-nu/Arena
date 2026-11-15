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
      className={`group cursor-pointer bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col h-full hover:border-secondary-500/50 hover:shadow-md transition-all duration-150 ${className}`}
    >
      {/* ── Image & Badges ── */}
      <div className="relative h-52 sm:h-56 overflow-hidden bg-neutral-100 flex-shrink-0">
        <img
          src={
            absoluteMediaSrc(event.image) ||
            event.image ||
            "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
          }
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges Row */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 text-xs font-medium text-neutral-800 shadow-xs">
            {derivedStatus === "live" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-600 font-semibold text-[11px]">Live match</span>
              </>
            ) : derivedStatus === "upcoming" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                <span className="text-neutral-800 font-semibold text-[11px]">Upcoming</span>
              </>
            ) : (
              <span className="text-neutral-500 text-[11px]">Completed</span>
            )}
          </div>

          <div className="px-3 py-1 rounded-md text-xs font-bold bg-secondary-500 text-white shadow-xs tabular-nums">
            {event.price > 0 ? `$${event.price}` : "Free Entry"}
          </div>
        </div>

        {/* Format Tag */}
        <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-neutral-950/85 border border-secondary-500/30 text-secondary-400 text-[11px] font-semibold backdrop-blur-xs">
          {event.tournamentType
            ? `${event.tournamentType === "both" ? "Team & Solo" : event.tournamentType} Division`
            : "Street Soccer"}
        </div>
      </div>

      {/* ── Card Content ── */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug mb-1.5 group-hover:text-secondary-500 transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed mb-4">
              {event.description}
            </p>
          )}

          {/* Meta Details with brand orange accent icons */}
          <div className="space-y-2 py-3 border-y border-neutral-100 mb-4 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="w-4 h-4 text-secondary-500 flex-shrink-0" />
              <span className="font-medium">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <IoLocationOutline className="w-4 h-4 text-secondary-500 flex-shrink-0" />
              <span className="font-medium truncate">{event.location || "Addis Ababa Mini-Stadium"}</span>
            </div>

            {event.maxParticipants > 0 && (
              <div className="flex items-center gap-2">
                <IoTrophyOutline className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                <span className="font-medium">
                  Max {event.maxParticipants} {event.tournamentType === "individual" ? "players" : "teams"}
                </span>
              </div>
            )}
          </div>

          {/* Countdown (Upcoming only) */}
          {derivedStatus === "upcoming" && countdownTarget && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5 font-medium">
                <span>Kickoff Countdown</span>
              </div>
              <CountdownTimer
                targetDate={countdownTarget}
                registrationDeadline={event.registrationDeadline}
                theme="light"
              />
            </div>
          )}

          {/* Capacity Progress Bar */}
          {derivedStatus !== "completed" && event.maxParticipants > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-neutral-500 font-medium">Roster Capacity</span>
                <span className="text-secondary-600 font-bold tabular-nums">
                  {event.participants} / {event.maxParticipants} slots
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-secondary-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 mt-auto">
          <span className="text-xs font-semibold text-neutral-700 group-hover:text-secondary-500 transition-colors inline-flex items-center gap-1">
            <span>View Details</span>
            <IoChevronForward className="w-3.5 h-3.5 text-secondary-500" />
          </span>

          {event.type === "tournament" && (
            <div>
              {isAlreadyRegistered ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
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
                  className="h-8 px-4 rounded-lg font-semibold text-xs text-white bg-secondary-500 hover:bg-secondary-600 transition-colors shadow-xs"
                >
                  Register
                </button>
              ) : (
                <span className="text-xs text-neutral-400 font-medium">Closed</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
