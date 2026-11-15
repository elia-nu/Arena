import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  { src: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=1000&fit=crop&q=80", alt: "Intense Tackle & Slide" },
  { src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80", alt: "Night Arena Lights" },
  { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop&q=80", alt: "Squad Champions Victory" },
  { src: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=1000&fit=crop&q=80", alt: "Fans & Stadium Atmosphere" },
  { src: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=1000&fit=crop&q=80", alt: "Floodlight Stadium Pitch" },
  { src: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&h=1000&fit=crop&q=80", alt: "Match Cleats on Turf" },
  { src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=1000&fit=crop&q=80", alt: "Deciding Strike in Net" },
  { src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=1000&fit=crop&q=80", alt: "Urban Team Strategy" },
  { src: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&h=1000&fit=crop&q=80", alt: "Championship Trophy" },
  { src: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?w=800&h=1000&fit=crop&q=80", alt: "City Street Tournament" },
  { src: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&h=1000&fit=crop&q=80", alt: "Midfield Masterclass" },
  { src: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=1000&fit=crop&q=80", alt: "Outdoor Arena Play" },
  { src: "https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800&h=1000&fit=crop&q=80", alt: "Street Arena Wall Pass" },
  { src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&fit=crop&q=80", alt: "Athletic Performance" },
  { src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1000&fit=crop&q=80", alt: "Pure Sports Emotion" },
  { src: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&h=1000&fit=crop&q=80", alt: "Celebration After Win" },
  { src: "https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=800&h=1000&fit=crop&q=80", alt: "Dribble Past Defenders" },
  { src: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&h=1000&fit=crop&q=80", alt: "Penalty Box Scramble" },
  { src: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&h=1000&fit=crop&q=80", alt: "Stadium Crowd Roar" },
  { src: "https://images.unsplash.com/photo-1536122985607-4fe00b283652?w=800&h=1000&fit=crop&q=80", alt: "Youth Championship Medal" },
  { src: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&h=1000&fit=crop&q=80", alt: "Game Preparation" },
  { src: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&h=1000&fit=crop&q=80", alt: "Street Panna Showdown" },
  { src: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&h=1000&fit=crop&q=80", alt: "Final Whistle Euphoria" },
  { src: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=1000&fit=crop&q=80", alt: "Street Cage Soccer" },
  { src: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=1000&fit=crop&q=80", alt: "Overhead Bicycle Kick" },
  { src: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&h=1000&fit=crop&q=80", alt: "Street Football Showcase" },
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

    // Merge API media at the start with the extensive curated internet photo collection
    return [...apiMapped, ...INTERNET_DOME_IMAGES];
  }, [media]);

  return (
    <section className="w-full bg-white text-primary-950 relative overflow-hidden py-16 md:py-24 border-t border-neutral-100">
      {/* ── Section Header ── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 text-center mb-8 md:mb-12">
        <motion.div
          className="inline-block mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2.5 px-6 py-2 border border-primary-950/10 bg-neutral-50 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-500 shadow-[0_0_8px_#FE5723]" />
            <span className="text-primary-950 text-xs font-semibold tracking-[0.25em] uppercase">
              360° Spherical Experience
            </span>
          </div>
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <span className="text-primary-950">The Arena </span>
          <span className="text-secondary-500">Dome Gallery</span>
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Rotate in 360° across our spherical visual archive. Click and drag in any direction
          to spin the dome, and tap any photo tile to inspect in high definition.
        </motion.p>
      </div>

      {/* ── Full-Width Dome Gallery Container ── */}
      <div className="w-full h-[620px] sm:h-[720px] md:h-[820px] lg:h-[880px] relative bg-white overflow-hidden select-none">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
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
            imageBorderRadius="22px"
            openedImageBorderRadius="24px"
            spinOnFirstScroll={true}
            spinDuration={7500}
          />
        )}

        {/* Floating Controls Bar at Bottom of Full-Width Dome */}
        <div className="absolute bottom-8 inset-x-0 flex flex-col sm:flex-row items-center justify-center gap-4 px-6 pointer-events-none z-30">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/95 border border-neutral-200/90 text-primary-950 text-xs font-semibold shadow-lg backdrop-blur-md pointer-events-auto">
            <FaCompass className="w-3.5 h-3.5 text-secondary-500" />
            <span>Drag in 360° to spin • Tap any tile to enlarge</span>
          </div>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-semibold text-xs bg-primary-950 text-white hover:bg-secondary-500 shadow-xl transition-all duration-300 pointer-events-auto cursor-pointer"
          >
            <span>Explore Full Gallery</span>
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DomeGallerySection;
