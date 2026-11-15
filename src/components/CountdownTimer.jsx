import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { IoTime } from "react-icons/io5";

const CountdownTimer = ({
  targetDate,
  onComplete,
  label = "Time remaining",
  expiredMessage = "Registration has closed",
  registrationDeadline,
  theme = "dark",
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [registrationPassed, setRegistrationPassed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();

      // If target date is invalid, treat as expired to avoid NaN values
      if (Number.isNaN(target)) {
        console.error("CountdownTimer: Invalid targetDate", targetDate);
        setIsExpired(true);
        setRegistrationPassed(false);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      const difference = target - now;

      // First check if start date has passed - this takes priority
      if (difference <= 0) {
        setIsExpired(true);
        setRegistrationPassed(false); // Don't show registration message if event has started
        if (onComplete) onComplete();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      // Then check if registration deadline has passed (but event hasn't started yet)
      if (registrationDeadline) {
        const registrationDate = new Date(registrationDeadline).getTime();
        if (!Number.isNaN(registrationDate) && now > registrationDate) {
          setRegistrationPassed(true);
          setIsExpired(false);
          return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
          };
        } else {
          setRegistrationPassed(false);
        }
      } else {
        setRegistrationPassed(false);
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete, registrationDeadline]);

  // Check if start date has passed first (takes priority)
  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <IoTime />
        <span>Event has started</span>
      </div>
    );
  }

  // Then check if registration deadline has passed (but event hasn't started)
  if (registrationPassed) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <IoTime />
        <span>{expiredMessage}</span>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex gap-2 sm:gap-3 justify-center w-full">
      {timeLeft.days > 0 && (
        <div
          key={timeLeft.days}
          className={`${
            isDark
              ? "bg-black/60 text-white border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              : "bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-200/90"
          } px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center min-w-[58px] sm:min-w-[68px] backdrop-blur-md`}
        >
          <div className="text-xl sm:text-2xl font-black text-secondary-500 mb-0.5 leading-none">
            {timeLeft.days}
          </div>
          <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${
            isDark ? "text-white/50" : "text-neutral-500"
          }`}>
            Days
          </div>
        </div>
      )}
      <div
        key={`${timeLeft.hours}-${timeLeft.minutes}-${timeLeft.seconds}`}
        className={`${
          isDark
            ? "bg-black/60 text-white border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            : "bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-200/90"
        } px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center min-w-[58px] sm:min-w-[68px] backdrop-blur-md`}
      >
        <div className={`text-xl sm:text-2xl font-black mb-0.5 leading-none ${
          isDark ? "text-white" : "text-neutral-900"
        }`}>
          {String(timeLeft.hours).padStart(2, "0")}
        </div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${
          isDark ? "text-white/50" : "text-neutral-500"
        }`}>
          Hours
        </div>
      </div>
      <div
        key={`${timeLeft.minutes}-${timeLeft.seconds}`}
        className={`${
          isDark
            ? "bg-black/60 text-white border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            : "bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-200/90"
        } px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center min-w-[58px] sm:min-w-[68px] backdrop-blur-md`}
      >
        <div className={`text-xl sm:text-2xl font-black mb-0.5 leading-none ${
          isDark ? "text-white" : "text-neutral-900"
        }`}>
          {String(timeLeft.minutes).padStart(2, "0")}
        </div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${
          isDark ? "text-white/50" : "text-neutral-500"
        }`}>
          Min
        </div>
      </div>
      <div
        key={timeLeft.seconds}
        className={`${
          isDark
            ? "bg-black/60 text-white border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            : "bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-200/90"
        } px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center min-w-[58px] sm:min-w-[68px] backdrop-blur-md`}
      >
        <div className="text-xl sm:text-2xl font-black text-secondary-500 mb-0.5 leading-none">
          {String(timeLeft.seconds).padStart(2, "0")}
        </div>
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${
          isDark ? "text-white/50" : "text-neutral-500"
        }`}>
          Sec
        </div>
      </div>
    </div>
  );
};

CountdownTimer.propTypes = {
  targetDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]).isRequired,
  onComplete: PropTypes.func,
  label: PropTypes.string,
  expiredMessage: PropTypes.string,
  registrationDeadline: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
};

export default CountdownTimer;
