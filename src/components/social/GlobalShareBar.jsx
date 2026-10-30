import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FaFacebookF,
  FaXTwitter,
  FaWhatsapp,
  FaLink,
  FaShareNodes,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import { useSocialAnalytics } from "../../context/SocialAnalyticsContext";

// Simple Tooltip Component
const Tooltip = ({ children, text, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-secondary-50 bg-primary-900/95 backdrop-blur-sm rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-secondary-500/30 ${positionClasses[position]}`}
        >
          {text}
          <div
            className={`absolute w-2 h-2 bg-primary-900/95 border-r border-b border-secondary-500/30 ${
              position === "top"
                ? "top-full left-1/2 -translate-x-1/2 rotate-45"
                : position === "bottom"
                  ? "bottom-full left-1/2 -translate-x-1/2 rotate-45"
                  : position === "left"
                    ? "left-full top-1/2 -translate-y-1/2 rotate-45"
                    : "right-full top-1/2 -translate-y-1/2 rotate-45"
            }`}
          />
        </div>
      )}
    </div>
  );
};

const getAbsoluteUrl = (pathname) => {
  if (typeof window === "undefined") return pathname || "/";
  const origin = window.location.origin;
  return `${origin}${pathname || "/"}`;
};

const GlobalShareBar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { trackEvent } = useSocialAnalytics();

  const shareUrl = useMemo(
    () => getAbsoluteUrl(location.pathname + location.search),
    [location.pathname, location.search],
  );

  const pageLabel = useMemo(() => {
    const path = location.pathname || "/";
    if (path === "/") return "Home";
    return path
      .slice(1)
      .split("/")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" / ");
  }, [location.pathname]);

  const handleShare = (platform) => {
    trackEvent({
      type: "share",
      platform,
      location: pageLabel,
      url: shareUrl,
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Les Kick't",
          text: `Check out this page on Les Kick't: ${pageLabel}`,
          url: shareUrl,
        });
        handleShare("native");
      } catch {
        // user cancelled; no-op
      }
    } else {
      await navigator.clipboard?.writeText(shareUrl);
      handleShare("copy");
    }
  };

  const buttons = [
    {
      id: "facebook",
      label: "Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}`,
    },
    {
      id: "x",
      label: "X / Twitter",
      icon: FaXTwitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl,
      )}&text=${encodeURIComponent("Check this out from Les Kick't")}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(
        `Check this out from Les Kick't: ${shareUrl}`,
      )}`,
    },
  ];

  const socialFollow = [
    { id: "instagram", label: "Instagram", icon: FaInstagram },
    { id: "tiktok", label: "TikTok", icon: FaTiktok },
    { id: "youtube", label: "YouTube", icon: FaYoutube },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        {/* Floating button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-950 text-secondary-500 shadow-xl shadow-primary-950/40 border border-secondary-500/40 hover:bg-secondary-500 hover:text-primary-950 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Share this page"
        >
          <FaShareNodes className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Panel */}
        {open && (
          <div className="absolute bottom-full right-0 mb-3 w-auto min-w-[200px] sm:min-w-[240px] rounded-2xl bg-primary-950/95 backdrop-blur-xl text-secondary-50 border border-secondary-500/30 shadow-2xl shadow-primary-950/60 p-4 sm:p-5 transform transition-all duration-200 ease-out">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-secondary-500 font-medium mb-1">
                  Share
                </p>
                <p className="text-sm sm:text-base font-semibold text-secondary-50 truncate">
                  {pageLabel}
                </p>
              </div>
              <Tooltip text="Close" position="top">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs sm:text-sm text-secondary-500 hover:text-secondary-200 transition-colors duration-200 flex-shrink-0 px-2 py-1 -mr-2 -mt-1"
                  aria-label="Close share panel"
                >
                  ✕
                </button>
              </Tooltip>
            </div>

            {/* Share Buttons - Icons Only */}
            <div className="flex gap-2.5 sm:gap-3 mb-4 justify-center">
              {buttons.map(({ id, label, icon: Icon, href }) => (
                <Tooltip key={id} text={label} position="top">
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleShare(id)}
                    className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-900/80 text-secondary-100 hover:bg-secondary-500 hover:text-primary-950 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label={`Share on ${label}`}
                  >
                    <Icon className="text-base sm:text-lg" />
                  </a>
                </Tooltip>
              ))}
              <Tooltip text="Copy link" position="top">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-900/80 text-secondary-100 hover:bg-secondary-500 hover:text-primary-950 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Copy link or share"
                >
                  <FaLink className="text-base sm:text-lg" />
                </button>
              </Tooltip>
            </div>

            {/* Follow Us Section - Icons Only */}
            <div className="flex items-center justify-center pt-3 border-t border-secondary-500/20">
              <div className="flex gap-2.5 sm:gap-3">
                {socialFollow.map(({ id, label, icon: Icon }) => (
                  <Tooltip key={id} text={label} position="top">
                    <button
                      type="button"
                      onClick={() =>
                        trackEvent({
                          type: "follow_click",
                          platform: id,
                          location: pageLabel,
                        })
                      }
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-900/80 text-secondary-100 hover:bg-secondary-500 hover:text-primary-950 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                      aria-label={`View ${label} profile`}
                    >
                      <Icon className="text-base sm:text-lg" />
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GlobalShareBar;
