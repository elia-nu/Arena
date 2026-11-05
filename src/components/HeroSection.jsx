import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { tournamentAPI } from "../services/api";

const HeroSection = () => {
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        setLoading(true);
        const data = await tournamentAPI.getAll({ limit: 10 });

        const allTournaments = data.tournaments || [];

        const now = new Date();

        // Only consider tournaments that are not completed/cancelled
        // and whose end date has not passed (or has no end date set)
        const activeTournaments = allTournaments.filter((tournament) => {
          const isFinished =
            tournament.status === "completed" ||
            tournament.status === "cancelled";

          const hasEnded =
            tournament.endDate &&
            new Date(tournament.endDate).getTime() < now.getTime();

          return !isFinished && !hasEnded;
        });

        // Prioritize featured (promoted) tournaments from active ones
        const featuredTournaments = activeTournaments.filter(
          (tournament) => tournament.isPromoted,
        );

        const fallbackTournaments = activeTournaments;

        const tournamentsToShow =
          featuredTournaments.length > 0
            ? featuredTournaments
            : fallbackTournaments;

        // Sort by start date and get the earliest upcoming event
        const sortedTournaments = tournamentsToShow.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate),
        );

        if (sortedTournaments.length > 0) {
          const latestEvent = sortedTournaments[0];
          setFeaturedEvent({
            id: latestEvent._id,
            type: latestEvent.type || "tournament",
            title: latestEvent.name,
            date: latestEvent.startDate,
            description:
              latestEvent.description ||
              "Compete, win, and dominate the field. Join hundreds of players in our biggest event yet.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch featured event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvent();
  }, []);

  const formatEventDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative w-full h-screen min-h-[600px] flex flex-col justify-center items-center bg-primary-950 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop"
          alt="Soccer Field"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/80 via-primary-950/60 to-primary-950/90" />
      </div>

      {/* Main Content — pb clears the absolute bottom promo so CTAs stay fully visible */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 sm:pt-20 pb-44 sm:pb-36">
        {/* Modern Top Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
          <span>Seattle&apos;s Premier Street Soccer & Tournaments</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter mb-4 leading-none">
          THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400">ARENA</span>
        </h1>

        <p className="mx-auto mb-6 px-4 text-center text-sm sm:text-base md:text-lg leading-relaxed tracking-[0.25em] text-secondary-400 font-semibold uppercase">
          THE &nbsp;GAME &nbsp;PLAN &nbsp;IS &nbsp;TO &nbsp;HAVE &nbsp;FUN &nbsp;&amp; &nbsp;WIN
        </p>
        <p className="text-base sm:text-lg md:text-xl text-primary-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Experience the thrill of competitive street soccer tournaments, youth development, and community impact across Greater Seattle.
        </p>

        <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center">
          <Link
            to="/events"
            className="px-6 py-3.5 sm:px-8 sm:py-4 bg-secondary-500 text-white text-base sm:text-lg font-bold rounded-full hover:bg-secondary-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-secondary-500/30 hover:shadow-secondary-500/50 whitespace-nowrap"
          >
            Join the Action →
          </Link>
          <Link
            to="/about-us"
            className="px-6 py-3.5 sm:px-8 sm:py-4 bg-white/10 border border-white/25 text-white text-base sm:text-lg font-medium rounded-full backdrop-blur-md hover:bg-white/20 hover:border-white/50 transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Bottom Ticker / Promo Section */}
      <div className="absolute bottom-0 w-full z-10 border-t border-white/15 bg-primary-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {loading ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex-1">
                <div className="h-4 bg-white/20 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
              </div>
              <div className="hidden md:block h-10 w-px bg-white/10"></div>
              <div className="flex-1 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded w-32 animate-pulse"></div>
            </div>
          ) : featuredEvent ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div>
                <h3 className="text-secondary-400 font-bold uppercase tracking-widest text-sm mb-1">
                  Coming Soon
                </h3>
                <p className="text-white text-lg font-semibold">
                  {featuredEvent.title}
                </p>
                {featuredEvent.date && (
                  <p className="text-primary-300 text-xs mt-1">
                    {formatEventDate(featuredEvent.date)}
                  </p>
                )}
              </div>
              <div className="hidden md:block h-10 w-px bg-white/10"></div>
              <p className="text-primary-300 text-sm max-w-lg">
                {featuredEvent.description}
              </p>
              <a
                href={`/events/${featuredEvent.type || "tournament"}/${featuredEvent.id}`}
                className="text-secondary-400 hover:text-secondary-300 font-semibold text-sm flex items-center gap-2 group"
              >
                Register Now
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div>
                <h3 className="text-secondary-400 font-bold uppercase tracking-widest text-sm mb-1">
                  Impact Highlights
                </h3>
                <p className="text-white text-lg font-semibold">
                  Summer &apos;26 Community Recap
                </p>
              </div>
              <div className="hidden md:block h-10 w-px bg-white/10"></div>
              <p className="text-primary-300 text-sm max-w-lg">
                7 community partnerships completed, over 500 youth players engaged, and championship moments celebrated across Seattle.
              </p>
              <Link
                to="/community-impact"
                className="text-secondary-400 hover:text-secondary-300 font-semibold text-sm flex items-center gap-2 group"
              >
                Explore Stories
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
