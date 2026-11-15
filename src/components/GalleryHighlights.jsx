import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
import LightboxViewer from "./gallery/LightboxViewer";
import DriftWall from "./reactbits/DriftWall";
import {
  FaImages,
  FaVideo,
  FaFire,
  FaCompass,
} from "react-icons/fa";
import { IoChevronForward } from "react-icons/io5";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&fm=webp&q=80";

const DEFAULT_HIGHLIGHTS = [
  {
    _id: "fb-1",
    event: "Championship Street Final",
    category: "highlights",
    type: "image",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&q=80",
    location: "Main Court",
    description: "High-octane tournament final under the arena floodlights.",
  },
  {
    _id: "fb-2",
    event: "Golden Goal Celebration",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=1000&fit=crop&q=80",
    location: "Center Ring",
    description: "Pure euphoria as the deciding strike hits the back of the net.",
  },
  {
    _id: "fb-3",
    event: "Street Panna Showdown",
    category: "highlights",
    type: "video",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=1000&fit=crop&q=80",
    location: "Cage 1",
    description: "Fast-paced 1v1 street soccer mastery.",
  },
  {
    _id: "fb-4",
    event: "Youth Development Academy",
    category: "community",
    type: "image",
    url: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&h=1000&fit=crop&q=80",
    location: "Community Pitch",
    description: "Empowering the next generation of players on and off the court.",
  },
  {
    _id: "fb-5",
    event: "Night Arena Atmosphere",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80",
    location: "Addis Ababa Pitch",
    description: "Electric atmosphere and packed sidelines.",
  },
  {
    _id: "fb-6",
    event: "Freestyle Exhibition",
    category: "highlights",
    type: "video",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail:
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=1000&fit=crop&q=80",
    location: "Freestyle Stage",
    description: "Acrobatic ball tricks and street skills.",
  },
  {
    _id: "fb-7",
    event: "Urban Cage Match",
    category: "events",
    type: "image",
    url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=1000&fit=crop&q=80",
    location: "Downtown Court",
    description: "Hardtop asphalt battles with neighborhood pride on the line.",
  },
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

const FILTER_OPTIONS = [
  { id: "all", label: "All Media", icon: null },
  { id: "highlights", label: "Highlights", icon: FaFire },
  { id: "photos", label: "Photos", icon: FaImages },
  { id: "videos", label: "Videos", icon: FaVideo },
];

const GalleryHighlights = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState(null);

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
        console.error("Error fetching gallery highlights:", err);
        if (isMounted) {
          setMedia([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  const fullPool = useMemo(() => {
    return [...media, ...DEFAULT_HIGHLIGHTS];
  }, [media]);

  const filteredList = useMemo(() => {
    if (activeFilter === "all") return fullPool;
    if (activeFilter === "photos")
      return fullPool.filter((item) => item.type !== "video");
    if (activeFilter === "videos")
      return fullPool.filter((item) => item.type === "video");
    return fullPool.filter(
      (item) => item.category?.toLowerCase() === activeFilter
    );
  }, [fullPool, activeFilter]);

  const driftWallItems = useMemo(() => {
    const base = filteredList.length > 0 ? filteredList : DEFAULT_HIGHLIGHTS;
    let list = [...base];
    while (list.length < 25) {
      list = [...list, ...base];
    }

    return list.slice(0, 36).map((item, index) => {
      const { coverSrc, isVideo } = resolveCover(item);
      return {
        image: coverSrc || FALLBACK_IMAGE,
        title: item.event || item.description || `Arena Moment ${index + 1}`,
        isVideo,
        rawItem: item,
      };
    });
  }, [filteredList]);

  const selectedIndex = useMemo(() => {
    if (!selectedMedia) return -1;
    return filteredList.findIndex(
      (m) => (m._id || m.id) === (selectedMedia._id || selectedMedia.id)
    );
  }, [selectedMedia, filteredList]);

  const handlePrevLightbox = () => {
    if (selectedIndex > 0) {
      setSelectedMedia(filteredList[selectedIndex - 1]);
    } else {
      setSelectedMedia(filteredList[filteredList.length - 1]);
    }
  };

  const handleNextLightbox = () => {
    if (selectedIndex < filteredList.length - 1) {
      setSelectedMedia(filteredList[selectedIndex + 1]);
    } else {
      setSelectedMedia(filteredList[0]);
    }
  };

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0e0f12] text-neutral-200 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 text-xs font-semibold text-secondary-400 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <span>Interactive Gallery</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3 uppercase">
            Captured in <span className="text-secondary-500">The Arena</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Tournament highlights, match photography, and community celebrations from Ethiopian street football.
          </p>

          {/* Filter Segment */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-lg bg-neutral-900 border border-neutral-800 max-w-md mx-auto mt-6">
            {FILTER_OPTIONS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-secondary-500 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Motion DriftWall Container */}
        <div className="relative h-[440px] sm:h-[520px] md:h-[600px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 mb-10">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-neutral-500">Loading gallery wall...</span>
            </div>
          ) : (
            <DriftWall
              items={driftWallItems}
              columns={5}
              tileWidth={230}
              tileHeight={150}
              gap={14}
              radius={10}
              tilt={10}
              turn={-8}
              speed={32}
              parallax={0.6}
              dim={0.5}
              overlayColor="#0e0f12"
              onItemClick={(item) => setSelectedMedia(item.rawItem)}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />
          )}

          {/* Hint Tag */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-30">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-xs backdrop-blur-xs">
              <FaCompass className="w-3.5 h-3.5 text-secondary-500" />
              <span>Hover & drag to tilt perspective • Click any tile to inspect</span>
            </div>
          </div>
        </div>

        {/* Action Link */}
        <div className="text-center">
          <Link
            to="/gallery"
            className="h-11 px-7 rounded-lg font-bold text-xs text-white bg-secondary-500 hover:bg-secondary-600 uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <span>Explore full gallery</span>
            <IoChevronForward className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <LightboxViewer
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onPrev={handlePrevLightbox}
            onNext={handleNextLightbox}
            hasPrev={filteredList.length > 1}
            hasNext={filteredList.length > 1}
            positionLabel={
              selectedIndex >= 0
                ? `${selectedIndex + 1} of ${filteredList.length}`
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default GalleryHighlights;
