import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { mediaAPI } from "../services/api";
import {
  absoluteMediaSrc,
  getOptimizedImageSrc,
  isDirectVideoFileUrl,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  detectVideoPlatform,
  isTournamentScopedMedia,
} from "../utils/mediaUtils";
import DomeGallery from "./reactbits/DomeGallery";
import { FaCompass, FaArrowRight } from "react-icons/fa";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&fm=webp&q=80";

const INTERNET_DOME_IMAGES = [
  { src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&q=80", alt: "Championship Street Final" },
  { src: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=1000&fit=crop&q=80", alt: "Golden Goal Celebration" },
  { src: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=1000&fit=crop&q=80", alt: "Street Soccer Match Ball" },
  { src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=1000&fit=crop&q=80", alt: "Team Tournament Celebration" },
  { src: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=1000&fit=crop&q=80", alt: "Freestyle Ball Skills" },
  { src: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=1000&fit=crop&q=80", alt: "Ball into Net Back" },
  { src: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&h=1000&fit=crop&q=80", alt: "Youth Development Academy" },
  { src: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&h=1000&fit=crop&q=80", alt: "Matchday Warmup Huddle" },
  { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop&q=80", alt: "Fast Break Sprint" },
  { src: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=1000&fit=crop&q=80", alt: "Corner Pitch Action" },
  { src: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=1000&fit=crop&q=80", alt: "Arena Night Stadium" },
  { src: "https://images.unsplash.com/photo-1508739773433-c26b3d09e071?w=800&h=1000&fit=crop&q=80", alt: "Intense Tackle & Slide" },
  { src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80", alt: "Night Arena Lights" },
  { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop&q=80", alt: "Squad Champions Victory" },
  { src: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=1000&fit=crop&q=80", alt: "Fans & Stadium Atmosphere" },
  { src: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=1000&fit=crop&q=80", alt: "Floodlight Stadium Pitch" },
  { src: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&h=1000&fit=crop&q=80", alt: "Match Cleats on Turf" },
  { src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=1000&fit=crop&q=80", alt: "Deciding Strike in Net" },
  { src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=1000&fit=crop&q=80", alt: "Urban Team Strategy" },
  { src: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&h=1000&fit=crop&q=80", alt: "Championship Trophy" },
];

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
      ? getOptimizedImageSrc(coverSrc, { width: 720, quality: 75 })
      : null,
    isVideo,
  };
};

const DomeGallerySection = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const data = await mediaAPI.getAll({ visibility: "public" });
        if (isMounted) {
          const publicItems = (data.media || []).filter(
            (item) => item.visibility === "public" && !isTournamentScopedMedia(item)
          );
          if (publicItems.length > 0) {
            setMedia(publicItems);
          } else {
            setMedia([]);
          }
        }
      } catch (err) {
        console.error("Error fetching dome gallery images:", err);
        if (isMounted) setMedia([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  const domeImages = useMemo(() => {
    const apiMapped = (media || []).map((m) => {
      if (m.src) return m;
      const { coverSrc } = resolveCover(m);
      return {
        src: coverSrc || FALLBACK_IMAGE,
        alt: m.event || m.description || "Arena match moment",
      };
    });

    return [...apiMapped, ...INTERNET_DOME_IMAGES];
  }, [media]);

  return (
    <section className="w-full bg-white text-neutral-900 py-16 md:py-20 border-t border-neutral-200">
      {/* ── Section Header ── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 text-center mb-8 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 text-xs font-semibold text-secondary-600 mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-secondary-500" />
          <span>360° Spherical Experience</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 mb-3 uppercase">
          The Arena <span className="text-secondary-500">Dome</span>
        </h2>

        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          Rotate in 360° across our spherical match archive. Click and drag in any direction to spin the dome, and select any tile to enlarge.
        </p>
      </div>

      {/* ── Full-Width Dome Gallery Container ── */}
      <div className="w-full h-[580px] sm:h-[680px] md:h-[760px] relative bg-white overflow-hidden select-none">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <span className="text-xs text-neutral-500">Loading dome...</span>
          </div>
        ) : (
          <DomeGallery
            images={domeImages}
            overlayBlurColor="#ffffff"
            grayscale={false}
            fit={0.58}
            minRadius={560}
            openedImageWidth="440px"
            openedImageHeight="440px"
            imageBorderRadius="16px"
            openedImageBorderRadius="18px"
            spinOnFirstScroll={true}
            spinDuration={7000}
            spinDegrees={160}
            autoRotate={false}
          />
        )}

        {/* Floating Controls Bar at Bottom */}
        <div className="absolute bottom-6 inset-x-0 flex flex-col sm:flex-row items-center justify-center gap-3 px-6 pointer-events-none z-30">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/95 border border-neutral-200 text-neutral-700 text-xs shadow-md backdrop-blur-xs pointer-events-auto">
            <FaCompass className="w-3.5 h-3.5 text-secondary-500" />
            <span>Drag in 360° to rotate • Tap tile to enlarge</span>
          </div>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg font-bold text-xs bg-secondary-500 hover:bg-secondary-600 text-white transition-colors pointer-events-auto shadow-xs uppercase tracking-wider"
          >
            <span>Explore full gallery</span>
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DomeGallerySection;
