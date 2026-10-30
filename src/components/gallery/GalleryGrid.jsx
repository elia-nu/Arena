import { motion } from "framer-motion";
import { FaPlay } from "react-icons/fa";
import {
  absoluteMediaSrc,
  getOptimizedImageSrc,
  isDirectVideoFileUrl,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  detectVideoPlatform,
} from "../../utils/mediaUtils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&fm=webp&q=80";

const resolveCover = (item) => {
  const isVideo = item.type === "video";
  const platform = isVideo
    ? item.platform || detectVideoPlatform(item.url || "")
    : null;

  const hasImageThumbnail =
    isVideo &&
    item.thumbnail &&
    typeof item.thumbnail === "string" &&
    !isDirectVideoFileUrl(item.thumbnail) &&
    (item.thumbnail.startsWith("http") || item.thumbnail.startsWith("/"));

  let coverSrc = null;

  if (!isVideo && item.url) {
    coverSrc = absoluteMediaSrc(item.url) || item.url;
  } else if (hasImageThumbnail) {
    coverSrc = absoluteMediaSrc(item.thumbnail) || item.thumbnail;
  } else if (isVideo && (platform === "youtube" || item.url)) {
    const vid = parseYouTubeUrl(item.url);
    if (vid) coverSrc = getYouTubeThumbnail(vid);
  }

  return {
    coverSrc: coverSrc
      ? getOptimizedImageSrc(coverSrc, { width: 720, quality: 72 })
      : null,
    isVideo,
  };
};

const GalleryGrid = ({ media, onMediaClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {media.map((item, index) => {
        const { coverSrc, isVideo } = resolveCover(item);

        return (
          <motion.button
            key={item._id || item.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{
              duration: 0.45,
              delay: Math.min(index * 0.035, 0.24),
              ease: "easeOut",
            }}
            onClick={() => onMediaClick(item, index)}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-primary-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-500"
          >
            <img
              src={coverSrc || FALLBACK_IMAGE}
              alt={item.event || "Gallery media"}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
              onError={(e) => {
                const vid = parseYouTubeUrl(item.url || "");
                if (vid && !e.target.dataset.fallbackTried) {
                  e.target.dataset.fallbackTried = "true";
                  e.target.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
                } else {
                  e.target.src = FALLBACK_IMAGE;
                }
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />

            {isVideo && (
              <span className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary-950 shadow-sm">
                <FaPlay className="h-3 w-3 ml-0.5" />
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 transition-all duration-300">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-1">
                {item.category?.replace(/-/g, " ") || "media"}
              </p>
              <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
                {item.event || "Untitled"}
              </h3>
              {item.location && (
                <p className="mt-1 text-xs text-white/65 line-clamp-1">
                  {item.location}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default GalleryGrid;
