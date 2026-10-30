const formatLabel = (value) =>
  value === "all" ? "All" : String(value).replace(/-/g, " ");

const Chip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize tracking-wide transition-all ${
      active
        ? "bg-primary-950 text-white"
        : "bg-white border border-primary-200 text-primary-700 hover:border-primary-400 hover:text-primary-950"
    }`}
  >
    {label}
  </button>
);

const GalleryFilters = ({
  categories = [],
  themes = [],
  activeFilter,
  activeTheme,
  activeType = "all",
  onFilterChange,
  onThemeChange,
  onTypeChange,
  resultCount,
  onReset,
  hasActiveFilters,
}) => {
  const types = [
    { id: "all", label: "All" },
    { id: "image", label: "Photos" },
    { id: "video", label: "Videos" },
  ];

  return (
    <div className="mb-8 md:mb-10 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex rounded-full border border-primary-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Media type"
        >
          {types.map((type) => {
            const active = activeType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTypeChange(type.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? "bg-secondary-500 text-white shadow-sm"
                    : "text-primary-600 hover:text-primary-950"
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {typeof resultCount === "number" && (
            <p className="text-sm text-primary-500">
              <span className="font-semibold text-primary-800">{resultCount}</span>{" "}
              shown
            </p>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold uppercase tracking-wider text-secondary-600 hover:text-secondary-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Chip
            key={category}
            label={formatLabel(category)}
            active={activeFilter === category}
            onClick={() => onFilterChange(category)}
          />
        ))}
      </div>

      {themes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="gallery-theme"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500"
          >
            Theme
          </label>
          <select
            id="gallery-theme"
            value={activeTheme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-primary-800 capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-400/40"
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {formatLabel(theme)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default GalleryFilters;
