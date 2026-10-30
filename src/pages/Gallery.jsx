import { motion } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";
import GalleryGrid from "../components/gallery/GalleryGrid";
import GalleryFilters from "../components/gallery/GalleryFilters";
import LightboxViewer from "../components/gallery/LightboxViewer";
import { mediaAPI } from "../services/api";
import { isTournamentScopedMedia } from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";

const DEFAULT_CATEGORIES = [
  "events",
  "highlights",
  "behind-the-scenes",
  "portraits",
  "other",
];

const DEFAULT_THEMES = [
  "Competition",
  "Performance",
  "Training",
  "Lifestyle",
  "Community",
];

const Gallery = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTheme, setActiveTheme] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [categories, setCategories] = useState(["all", ...DEFAULT_CATEGORIES]);
  const [themes, setThemes] = useState(["all", ...DEFAULT_THEMES]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mediaResponse, categoriesRes, themesRes] = await Promise.all([
          mediaAPI.getAll({ visibility: "public" }),
          mediaAPI.getCategories(),
          mediaAPI.getThemes(),
        ]);

        setMedia(mediaResponse.media || []);

        const nextCategoryValues = (categoriesRes.categories || []).map(
          (c) => c.value
        );
        const nextThemeValues = (themesRes.themes || []).map((t) => t.value);

        setCategories([
          "all",
          ...(nextCategoryValues.length
            ? nextCategoryValues
            : DEFAULT_CATEGORIES),
        ]);
        setThemes([
          "all",
          ...(nextThemeValues.length ? nextThemeValues : DEFAULT_THEMES),
        ]);

        setError(null);
      } catch (err) {
        console.error("Error fetching gallery data:", err);
        setError("Failed to load gallery. Please try again later.");
        setMedia([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const galleryMedia = useMemo(() => {
    return media.filter((item) => {
      if (item.visibility !== "public") return false;
      if (isTournamentScopedMedia(item)) return false;
      return true;
    });
  }, [media]);

  const filteredMedia = useMemo(() => {
    return galleryMedia.filter((item) => {
      const matchesCategory =
        activeFilter === "all" || item.category === activeFilter;
      const matchesTheme = activeTheme === "all" || item.theme === activeTheme;
      const matchesType = activeType === "all" || item.type === activeType;
      return matchesCategory && matchesTheme && matchesType;
    });
  }, [galleryMedia, activeFilter, activeTheme, activeType]);

  const hasActiveFilters =
    activeFilter !== "all" || activeTheme !== "all" || activeType !== "all";

  const resetFilters = () => {
    setActiveFilter("all");
    setActiveTheme("all");
    setActiveType("all");
  };

  const openAt = useCallback((_item, index) => {
    setSelectedIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setSelectedIndex(null), []);

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i == null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => {
      if (i == null) return i;
      if (i >= filteredMedia.length - 1) return i;
      return i + 1;
    });
  }, [filteredMedia.length]);

  const selectedMedia =
    selectedIndex != null ? filteredMedia[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 relative z-10">
        <motion.header
          className="mb-8 md:mb-10 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-600 mb-3">
            Gallery
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary-950 mb-3">
            Moments on <span className="text-secondary-500">the pitch</span>
          </h1>
          <p className="text-base text-primary-600 leading-relaxed">
            Photos and video from games, training, and community nights.
          </p>
        </motion.header>

        {!loading && !error && (
          <GalleryFilters
            categories={categories}
            themes={themes}
            activeFilter={activeFilter}
            activeTheme={activeTheme}
            activeType={activeType}
            onFilterChange={setActiveFilter}
            onThemeChange={setActiveTheme}
            onTypeChange={setActiveType}
            resultCount={filteredMedia.length}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-2xl bg-primary-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <EmptyState
            variant="error"
            title="Unable to load gallery"
            description={error}
            actionLabel="Back to home"
            actionTo="/"
          />
        )}

        {!loading && !error && filteredMedia.length === 0 && (
          <EmptyState
            variant="gallery"
            title="No media found"
            description="Try a different filter, or check back soon for new moments."
            actionLabel="Clear filters"
            onAction={resetFilters}
          />
        )}

        {!loading && !error && filteredMedia.length > 0 && (
          <GalleryGrid media={filteredMedia} onMediaClick={openAt} />
        )}
      </div>

      {selectedMedia && (
        <LightboxViewer
          media={selectedMedia}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filteredMedia.length - 1}
          positionLabel={`${selectedIndex + 1} / ${filteredMedia.length}`}
        />
      )}
    </div>
  );
};

export default Gallery;
