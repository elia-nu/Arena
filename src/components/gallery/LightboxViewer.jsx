import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaShare,
  FaFacebook,
  FaTwitter,
  FaLink,
  FaDownload,
  FaYoutube,
  FaTiktok,
  FaExternalLinkAlt,
  FaTimes,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  getVideoEmbedUrl,
  getShareUrl,
  absoluteMediaSrc,
  isDirectVideoFileUrl,
  detectVideoPlatform,
} from "../../utils/mediaUtils";

function directVideoMimeType(url) {
  if (!url || typeof url !== "string") return "video/mp4";
  const base = url.split("?")[0].split("#")[0].toLowerCase();
  if (base.endsWith(".webm")) return "video/webm";
  if (base.endsWith(".ogg")) return "video/ogg";
  if (base.endsWith(".mov") || base.endsWith(".m4v")) return "video/quicktime";
  return "video/mp4";
}

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white border border-white/15 backdrop-blur-sm transition hover:bg-white/20";

const LightboxViewer = ({
  media,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  positionLabel,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [readyToPlayDirectVideo, setReadyToPlayDirectVideo] = useState(false);

  useEffect(() => {
    setReadyToPlayDirectVideo(false);
    setShowShareMenu(false);
    setCopySuccess(false);
  }, [media?._id, media?.url]);

  useEffect(() => {
    if (!media) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      if (e.key === "ArrowRight" && hasNext) onNext?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [media, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!media) return null;

  const shareUrl = window.location.origin + "/gallery";
  const shareText = `Check out ${media.event || "this moment"} from The Arena`;

  const handleShare = (platform) => {
    const url = getShareUrl(platform, shareUrl, shareText);
    if (url) window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareMenu(false);
      }, 1600);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    if (media.type !== "image") return;
    const link = document.createElement("a");
    link.href = absoluteMediaSrc(media.url) || media.url;
    link.download = `${(media.event || "gallery").replace(/\s+/g, "-")}.jpg`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageSrc = absoluteMediaSrc(media.url) || media.url;
  const isDirectUploadVideo =
    media.type === "video" &&
    (media.platform === "direct" || isDirectVideoFileUrl(media.url));
  const resolvedEmbedPlatform =
    media.type === "video" && !isDirectUploadVideo
      ? media.platform || detectVideoPlatform(media.url)
      : null;
  const embedUrl =
    media.type === "video" &&
    !isDirectUploadVideo &&
    resolvedEmbedPlatform &&
    ["youtube", "tiktok"].includes(resolvedEmbedPlatform)
      ? getVideoEmbedUrl(media.url, resolvedEmbedPlatform)
      : null;
  const directVideoSrc =
    media.type === "video" && isDirectUploadVideo
      ? absoluteMediaSrc(media.url) || media.url
      : null;
  const originalUrl = absoluteMediaSrc(media.url) || media.url;
  const hasDetails = Boolean(
    media.description || media.location || media.tags?.length
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col bg-primary-950/95"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div
          className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 truncate">
              {media.category?.replace(/-/g, " ") || "Gallery"}
              {media.theme ? ` · ${media.theme}` : ""}
              {positionLabel ? ` · ${positionLabel}` : ""}
            </p>
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {media.event || "Untitled"}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {media.type === "image" && (
              <button
                type="button"
                onClick={handleDownload}
                className={iconBtn}
                title="Download"
                aria-label="Download"
              >
                <FaDownload className="h-3.5 w-3.5" />
              </button>
            )}
            {media.type === "video" && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={iconBtn}
                title="Open original"
                aria-label="Open original"
              >
                <FaExternalLinkAlt className="h-3.5 w-3.5" />
              </a>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShareMenu((v) => !v)}
                className={iconBtn}
                title="Share"
                aria-label="Share"
              >
                <FaShare className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    className="absolute right-0 top-12 min-w-[168px] rounded-xl border border-white/10 bg-primary-900 p-1.5 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => handleShare("facebook")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      <FaFacebook className="h-4 w-4 text-blue-400" />
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare("twitter")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      <FaTwitter className="h-4 w-4 text-sky-400" />
                      Twitter
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                    >
                      <FaLink className="h-4 w-4 text-secondary-400" />
                      {copySuccess ? "Copied" : "Copy link"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={iconBtn}
              title="Close"
              aria-label="Close"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-14 pb-4">
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev?.();
              }}
              className="absolute left-2 sm:left-4 z-20 hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/20 transition"
              aria-label="Previous"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="absolute right-2 sm:right-4 z-20 hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/20 transition"
              aria-label="Next"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          )}

          <motion.div
            key={media._id || media.url}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-5xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {media.type === "image" ? (
              <img
                src={imageSrc}
                alt={media.event || "Gallery media"}
                className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop";
                }}
              />
            ) : isDirectUploadVideo && directVideoSrc ? (
              readyToPlayDirectVideo ? (
                <video
                  controls
                  playsInline
                  preload="none"
                  controlsList="nodownload"
                  autoPlay
                  className="mx-auto max-h-[72vh] w-full rounded-lg bg-black"
                  title={media.event}
                >
                  <source
                    src={directVideoSrc}
                    type={directVideoMimeType(directVideoSrc)}
                  />
                </video>
              ) : (
                <button
                  type="button"
                  onClick={() => setReadyToPlayDirectVideo(true)}
                  className="group relative mx-auto flex h-[55vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg bg-black"
                  title="Play video"
                >
                  {media.thumbnail && !isDirectVideoFileUrl(media.thumbnail) ? (
                    <img
                      src={
                        absoluteMediaSrc(media.thumbnail) || media.thumbnail
                      }
                      alt={media.event}
                      className="absolute inset-0 h-full w-full object-cover opacity-65"
                    />
                  ) : null}
                  <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-950 shadow-lg transition group-hover:scale-105">
                    <FaPlay className="h-5 w-5 ml-0.5" />
                  </span>
                </button>
              )
            ) : embedUrl ? (
              <div className="relative mx-auto h-[55vh] sm:h-[68vh] w-full overflow-hidden rounded-lg bg-black">
                {resolvedEmbedPlatform === "youtube" && (
                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
                    <FaYoutube className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                      YouTube
                    </span>
                  </div>
                )}
                {resolvedEmbedPlatform === "tiktok" && (
                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/80 border border-white/20 px-2.5 py-1">
                    <FaTiktok className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                      TikTok
                    </span>
                  </div>
                )}
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={media.event}
                />
              </div>
            ) : media.type === "video" ? (
              <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/70 text-sm">
                  This video can&apos;t be embedded here. Open it in a new tab
                  to watch.
                </p>
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary-600 transition"
                >
                  <FaExternalLinkAlt className="h-3.5 w-3.5" />
                  Open video
                </a>
              </div>
            ) : null}
          </motion.div>
        </div>

        {hasDetails && (
          <div
            className="relative z-20 mx-auto w-full max-w-3xl px-4 sm:px-6 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              {media.location && (
                <p className="text-xs text-white/55 mb-1">{media.location}</p>
              )}
              {media.description && (
                <p className="text-sm text-white/85 leading-relaxed">
                  {media.description}
                </p>
              )}
              {media.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {media.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/65"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(hasPrev || hasNext) && (
          <div className="sm:hidden flex items-center justify-center gap-6 pb-5">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={(e) => {
                e.stopPropagation();
                onPrev?.();
              }}
              className={`${iconBtn} disabled:opacity-30`}
              aria-label="Previous"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className={`${iconBtn} disabled:opacity-30`}
              aria-label="Next"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default LightboxViewer;
